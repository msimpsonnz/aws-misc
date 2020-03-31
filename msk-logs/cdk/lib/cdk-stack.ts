import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import ec2 = require('@aws-cdk/aws-ec2');
import msk = require('@aws-cdk/aws-msk');
import eks = require('@aws-cdk/aws-eks');
import es = require('@aws-cdk/aws-elasticsearch');
import { CfnOutput, Duration } from '@aws-cdk/core';
import lambda = require('@aws-cdk/aws-lambda');
import { ServicePrincipal, ManagedPolicy, PolicyDocument, PolicyStatement } from '@aws-cdk/aws-iam';
import rds = require('@aws-cdk/aws-rds');
import { InstanceClass, InstanceSize } from '@aws-cdk/aws-ec2';
import { DatabaseClusterEngine } from '@aws-cdk/aws-rds';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'msk-demo-vpc', {
      cidr: '172.16.0.0/16'
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
      kafkaVersion: '2.2.1',
      encryptionInfo: {
        encryptionInTransit: {
          clientBroker: 'TLS_PLAINTEXT'
        }
      }
    });

    // const clusterAdmin = new iam.Role(this, 'AdminRole', {
    //   assumedBy: new iam.AccountRootPrincipal()
    // });

    // const eksCluster = new eks.Cluster(this, 'msk-EKSCluster', {
    //   clusterName: 'msk-EKSCluster',
    //   mastersRole: clusterAdmin,
    //   vpc: vpc
    // });

    // const esCluster = new es.CfnDomain(this, 'msk-es-domain', {
    //   ebsOptions: {
    //     ebsEnabled: true,
    //     volumeType: 'gp2',
    //     volumeSize: 100
    //   },
    //   vpcOptions: {
    //     subnetIds: [
    //       vpc.privateSubnets[0].subnetId
    //     ]
    //   }
    // });

    // const lambdaProducer = new lambda.Function(this, 'lambdaProducer', {
    //   functionName: 'msk-lambdaProducer',
    //   code: lambda.Code.asset("../src/kafka-lambda/producer/function.zip"),
    //   handler: "handler.handler",
    //   runtime: lambda.Runtime.PYTHON_3_7,
    //   timeout: Duration.seconds(500),
    //   vpc: vpc,
    //   vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE },
    //   //securityGroup: 
    //   environment: {
    //     AWS_KAFKA_TOPIC: 'AWSKafkaTutorialTopic',
    //     AWS_MSK_BOOTSTRAP: 'TBC'

    //   }
    // });

    // const lambdaRole = new iam.Role(this, 'msk-LambdaRole', {
    //   assumedBy: new ServicePrincipal('lambda.amazonaws.com')
    // });
    // lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));
    // lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'));
    // lambdaRole.attachInlinePolicy(
    //   new iam.Policy(this, "msk-lambdaRolePolicy", {
    //     statements: [
    //       new iam.PolicyStatement({
    //         actions: ["es:ESHttpPut"],
    //         resources: ['*']
    //       })
    //     ]
    //   })
    // );

    // const lambdaConsumer = new lambda.Function(this, 'lambdaConsumer', {
    //   functionName: 'msk-lambdaConsumer',
    //   code: lambda.Code.asset("../src/kafka-lambda/consumer/function.zip"),
    //   handler: "handler.handler",
    //   runtime: lambda.Runtime.PYTHON_3_7,
    //   timeout: Duration.seconds(500),
    //   role: lambdaRole,
    //   vpc: vpc,
    //   vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE },
    //   //securityGroup: vpc.vpcDefaultSecurityGroup,
    //   environment: {
    //     AWS_KAFKA_TOPIC: 'AWSKafkaTutorialTopic',
    //     AWS_MSK_BOOTSTRAP: 'TBC',
    //     AWS_ES_DOMAIN: esCluster.attrDomainEndpoint

    //   }
    // });

    // const auroraCluster = new rds.DatabaseCluster(this, 'msk-aurora', {
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

  }
}
