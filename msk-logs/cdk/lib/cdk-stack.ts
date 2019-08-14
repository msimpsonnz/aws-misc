import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import msk = require('@aws-cdk/aws-msk');
import eks = require('@aws-cdk/aws-eks');
import es = require('@aws-cdk/aws-elasticsearch');
import { CfnOutput, Duration } from '@aws-cdk/core';
import lambda = require('@aws-cdk/aws-lambda')

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'msk-demo-vpc', {
      cidr: '10.0.0.0/16'
    });


    const mskCluster = new msk.CfnCluster(this, 'msk-demo-cluster', {
      clusterName: 'msk-demo-cluster',
      brokerNodeGroupInfo: {
        clientSubnets: [
          vpc.privateSubnets[0].subnetId,
          vpc.privateSubnets[1].subnetId,
          vpc.privateSubnets[2].subnetId
        ],
        instanceType: 'kafka.m5.large',
        brokerAzDistribution: 'DEFAULT'
      },
      numberOfBrokerNodes: 3,
      kafkaVersion: '2.1.0'
    });

    //new cdk.CfnOutput(this, 'MskArn', { value: getmskCluster });

    const eksCluster = new eks.Cluster(this, 'msk-EKSCluster', {
      clusterName: 'mskEKSClusterB024D504',
      vpc
    });

    eksCluster.addCapacity('Nodes', {
      instanceType: new ec2.InstanceType('t2.medium'),
      desiredCapacity: 1
    });

    const esCluster = new es.CfnDomain(this, 'msk-es-domain', {
      ebsOptions: {
        ebsEnabled: true,
        volumeType: 'gp2',
        volumeSize: 100
      },
      vpcOptions: {
        subnetIds: [
          vpc.privateSubnets[0].subnetId
        ]
      }
    });

    const lambdaProducer = new lambda.Function(this, 'lambdaProducer', {
      functionName: 'msk-lambdaProducer',
      code: lambda.Code.asset("../src/kafka-lambda/function.zip"),
      handler: "handler.handler",
      runtime: lambda.Runtime.PYTHON_3_7,
      timeout: Duration.seconds(500),
      vpc: vpc,
      environment:{
        //AWS_DYNAMODB: dynamoTable.tableName
        AWS_KAFKA_TYPE: 'PRODUCER',
        AWS_KAFKA_TOPIC: 'AWSKafkaTutorialTopic',
        AWS_MSK_BOOTSTRAP: 'TBC'

      }
    });

    const lambdaConsumer = new lambda.Function(this, 'lambdaConsumer', {
      functionName: 'msk-lambdaConsumer',
      code: lambda.Code.asset("../src/kafka-lambda/function.zip"),
      handler: "handler.handler",
      runtime: lambda.Runtime.PYTHON_3_7,
      timeout: Duration.seconds(500),
      vpc: vpc,
      environment:{
        //AWS_DYNAMODB: dynamoTable.tableName
        AWS_KAFKA_TYPE: 'CONSUMER',
        AWS_KAFKA_TOPIC: 'AWSKafkaTutorialTopic',
        AWS_MSK_BOOTSTRAP: 'TBC'

      }
    });
    
    
  }
}
