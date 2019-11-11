import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
//import rds = require('@aws-cdk/aws-rds');
import { DatabaseCluster, DatabaseClusterEngine } from '@aws-cdk/aws-rds';
//import { InstanceType, Port } from '@aws-cdk/aws-ec2';
import lambda = require('@aws-cdk/aws-lambda');
import { Duration } from '@aws-cdk/core';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'default', {
      isDefault: true
    });

    const cluster = new DatabaseCluster(this, 'Database', {
      engine: DatabaseClusterEngine.AURORA,
      masterUser: {
          username: 'admin'
      },
      instanceProps: {
          instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
          vpcSubnets: {
              subnetType: ec2.SubnetType.PUBLIC,
          },
          vpc
      }
    });

    cluster.connections.allowFromAnyIpv4(ec2.Port.tcp(3306));
  
    const writeAddress = cluster.clusterEndpoint.socketAddress;

    const fn = new lambda.Function(this, 'lam-dotnet-xray', {
      functionName: 'lam-dotnet-xray',
      code: lambda.Code.asset("../src/kafka-lambda/producer/function.zip"),
      handler: "handler.handler",
      runtime: lambda.Runtime.PYTHON_3_7,
      timeout: Duration.seconds(500),
      environment: {
        AWS_KAFKA_TOPIC: 'AWSKafkaTutorialTopic',
        AWS_MSK_BOOTSTRAP: 'TBC'
      }
    });

    

  }
}
