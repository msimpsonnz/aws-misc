import cdk = require('@aws-cdk/core');
import { Role, ServicePrincipal, PolicyStatement, PolicyDocument } from '@aws-cdk/aws-iam';
import { CfnDBCluster, ClusterParameterGroup, CfnDBInstance } from '@aws-cdk/aws-rds';
import dms = require('@aws-cdk/aws-dms');
import { CfnEndpoint, CfnReplicationTask } from '@aws-cdk/aws-dms';
import kinesis = require('@aws-cdk/aws-kinesis');
import { CfnDeliveryStream } from '@aws-cdk/aws-kinesisfirehose';
import s3 = require('@aws-cdk/aws-s3');

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const auroraParam = new ClusterParameterGroup(this, 'dms-aurora-mysql5.7', {
      family: 'aurora-mysql5.7',
      parameters: {
        binlog_format: 'ROW'
      }
    });

    const auroraCluster = new CfnDBCluster(this, 'tickets-db', {
      engine: 'aurora-mysql',
      engineVersion: '5.7.12',
      snapshotIdentifier: 'tickets-mysql',
      dbClusterParameterGroupName: auroraParam.parameterGroupName
    });

    // new CfnDBInstance(this, 'dms-aurora-instance1', {
    //   dbInstanceClass: 'db.r5.large',
    //   allocatedStorage: '100',
    //   engine: 'aurora-mysql',
    //   dbClusterIdentifier: auroraCluster.dbClusterIdentifier
    // });

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
      serverName: auroraCluster.attrEndpointAddress,
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
