import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import ecs = require('@aws-cdk/aws-ecs');
import { DatabaseCluster, DatabaseClusterEngine, CfnDBCluster } from '@aws-cdk/aws-rds';
import { InstanceClass, InstanceSize } from '@aws-cdk/aws-ec2';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'VPC');

    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
    });
    
    // Add capacity to it
    cluster.addCapacity('DefaultAutoScalingGroupCapacity', {
      instanceType: new ec2.InstanceType("t2.xlarge"),
      desiredCapacity: 1,
    });

    // const aurora = new CfnDBCluster(this, 'Database' {
    //   engineMode: 
    // });

    const Aurora = new DatabaseCluster(this, 'Database', {
      engine: DatabaseClusterEngine.AURORA,
      masterUser: {
          username: 'admin'
      },
      instanceProps: {
          instanceType: ec2.InstanceType.of(InstanceClass.BURSTABLE2, InstanceSize.MEDIUM),
          vpcSubnets: {
              subnetType: ec2.SubnetType.PUBLIC,
          },
          vpc
      },
    });

    

  }
}
