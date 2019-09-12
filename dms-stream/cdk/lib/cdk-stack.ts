import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import ec2 = require('@aws-cdk/aws-ec2');
import dms = require('@aws-cdk/aws-dms');
import { CfnEndpoint } from '@aws-cdk/aws-dms';
import rds = require('@aws-cdk/aws-rds');
import { DatabaseClusterEngine, CfnDBCluster } from '@aws-cdk/aws-rds';
import { InstanceClass, InstanceSize } from '@aws-cdk/aws-ec2';
import kinesis = require('@aws-cdk/aws-kinesis');


export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // const vpc = ec2.Vpc.fromLookup(this, 'default', {
    //   isDefault: true
    // });

    // const auroraCluster = new CfnDBCluster(this, 'tickets-db', {
    //   engine: 'aurora-mysql',
    //   engineVersion: '5.7.12',
    //   snapshotIdentifier: 'tickets'
    // });

    // const auroraCluster = new rds.DatabaseCluster(this, 'dms-stream-aurora', {
    //   engine: DatabaseClusterEngine.AURORA,
    //   masterUser: {
    //     username: 'admin'
    //   },
    //   instanceProps: {
    //     instanceType: ec2.InstanceType.of(InstanceClass.BURSTABLE2, InstanceSize.SMALL),
    //     vpcSubnets: {
    //       subnetType: ec2.SubnetType.PRIVATE,
    //     },
    //     vpc
    //   }
    // });

    const dmsRep = new dms.CfnReplicationInstance(this, 'dms-replication', {
      replicationInstanceClass: 'dms.t2.medium'
    });

    const stream = new kinesis.Stream(this, 'dms-stream');
    //stream.grantWrite();

    const source = new CfnEndpoint(this, 'dms-source', {
      endpointType: 'source',
      engineName: 'aurora',
      username: 'dms_user',
      password: 'dms_user'

    });

    const target = new CfnEndpoint(this, 'dms-target', {
      endpointType: 'target',
      engineName: 'kinesis',
      kinesisSettings: {
        messageFormat: 'JSON',
        streamArn: stream.streamArn
      }

    });



  }
}
