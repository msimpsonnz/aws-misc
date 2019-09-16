import cdk = require('@aws-cdk/core');
import { Role, ServicePrincipal, PolicyStatement, PolicyDocument } from '@aws-cdk/aws-iam';
import rds = require('@aws-cdk/aws-rds');
import { DatabaseInstanceEngine, ParameterGroup } from '@aws-cdk/aws-rds';
import dms = require('@aws-cdk/aws-dms');
import { CfnEndpoint, CfnReplicationTask } from '@aws-cdk/aws-dms';
import kinesis = require('@aws-cdk/aws-kinesis');
import { CfnDeliveryStream } from '@aws-cdk/aws-kinesisfirehose';
import s3 = require('@aws-cdk/aws-s3');
import ec2 = require('@aws-cdk/aws-ec2');
import { InstanceClass, InstanceSize, SubnetType } from '@aws-cdk/aws-ec2';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'default', {
      isDefault: true
    })

    const dbParam = new ParameterGroup(this, 'dms-param-mysql5.7', {
      family: 'mysql5.7',
      parameters: {
        binlog_format: 'ROW'
      }
    });

    const sourcedb = new rds.DatabaseInstanceFromSnapshot(this, 'dms-rds-source', {
      engine: DatabaseInstanceEngine.MYSQL,
      instanceClass: ec2.InstanceType.of(InstanceClass.BURSTABLE2, InstanceSize.SMALL),
      snapshotIdentifier: 'tickets-mysql57',
      vpc: vpc,
      vpcPlacement: {
        subnetType: SubnetType.PUBLIC,
      },
      parameterGroup: dbParam
    });

    const dmsRep = new dms.CfnReplicationInstance(this, 'dms-replication', {
      replicationInstanceClass: 'dms.t2.medium',
      engineVersion: '3.3.0'
    });

    const stream = new kinesis.Stream(this, 'dms-stream');

    const streamWriterRole = new Role(this, 'dms-stream-role', {
      assumedBy: new ServicePrincipal('dms.amazonaws.com')
    });

    streamWriterRole.addToPolicy(new PolicyStatement({
      resources: [stream.streamArn],
      actions: [
        'kinesis:DescribeStream',
        'kinesis:PutRecord',
        'kinesis:PutRecords'
      ]
    }));

    const source = new CfnEndpoint(this, 'dms-source', {
      endpointType: 'source',
      engineName: 'aurora',
      username: 'admin',
      password: 'Password1',
      serverName: sourcedb.dbInstanceEndpointAddress,
      port: 3306

    });

    const target = new CfnEndpoint(this, 'dms-target', {
      endpointType: 'target',
      engineName: 'kinesis',
      kinesisSettings: {
        messageFormat: 'JSON',
        streamArn: stream.streamArn,
        serviceAccessRoleArn: streamWriterRole.roleArn
      }
    });

    var dmsTableMappings = {
      "rules": [
        {
          "rule-type": "selection",
          "rule-id": "1",
          "rule-name": "1",
          "object-locator": {
            "schema-name": "dms_sample",
            "table-name": "ticket_purchase_hist"
          },
          "rule-action": "include"
        }
      ]
    }

    new CfnReplicationTask(this, 'dms-stream-repTask', {
      replicationInstanceArn: dmsRep.ref,
      migrationType: 'full-load-and-cdc',
      sourceEndpointArn: source.ref,
      targetEndpointArn: target.ref,
      tableMappings: JSON.stringify(dmsTableMappings)
    });

    const firehoseRole = new Role(this, 'dms-stream-firehose-role', {
      assumedBy: new ServicePrincipal('firehose.amazonaws.com'),
      inlinePolicies: {
        firehosePolicy: new PolicyDocument({
          statements: [new PolicyStatement({
            resources: ['*'],
            actions: [
              'kinesis:DescribeStream',
              'kinesis:Get*'
            ]
          })
          ]
        })
      }
    });

    const s3bucket = new s3.Bucket(this, 'dms-stream-bucket');
    s3bucket.grantReadWrite(firehoseRole);

    const firehose = new CfnDeliveryStream(this, 'dms-stream-firehose', {
      deliveryStreamType: 'KinesisStreamAsSource',
      kinesisStreamSourceConfiguration: {
        kinesisStreamArn: stream.streamArn,
        roleArn: firehoseRole.roleArn
      },
      s3DestinationConfiguration: {
        bucketArn: s3bucket.bucketArn,
        bufferingHints: {
          intervalInSeconds: 300,
          sizeInMBs: 5
        },
        compressionFormat: 'GZIP',
        roleArn: firehoseRole.roleArn
      }
    });

  }
}
