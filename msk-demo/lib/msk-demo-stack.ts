import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as msk from '@aws-cdk/aws-msk';
import * as ecs from '@aws-cdk/aws-ecs';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as cloudmap from '@aws-cdk/aws-servicediscovery';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';

export class MskDemoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'msk-demo-vpc', {
      cidr: '172.16.0.0/16',
      maxAzs: 3,
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: 'PUBLIC',
          cidrMask: 24,
        },
        {
          cidrMask: 24,
          name: 'PRIVATE',
          subnetType: ec2.SubnetType.PRIVATE,
        },
      ],
    });

    const mskCluster = new msk.CfnCluster(this, 'msk-demo', {
      clusterName: 'msk-demo',
      brokerNodeGroupInfo: {
        clientSubnets: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE })
          .subnetIds,
        instanceType: 'kafka.m5.large',
        brokerAzDistribution: 'DEFAULT',
      },
      numberOfBrokerNodes: 4,
      kafkaVersion: '2.2.1',
      encryptionInfo: {
        encryptionInTransit: {
          clientBroker: 'TLS_PLAINTEXT',
        },
      },
      configurationInfo: {
        arn: 'arn:aws:kafka:ap-southeast-2:383358879677:configuration/msk-demo-config/75dc0e13-0c54-43e9-b06d-dd71243caf48-3',
        revision: 1
      }
    });

    const mySecurityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      description: 'Allow ssh access to ec2 instances',
      allowAllOutbound: true, // Can be set to false
    });
    mySecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'allow ssh access from the world'
    );

    //const sgDefault

    const cloudMapNamespace = new cloudmap.PrivateDnsNamespace(this, 'cloudMapNamespace', {
      name: 'msk',
      vpc,
    });

    const ecsCluster = new ecs.Cluster(this, 'Cluster', {
      vpc: vpc,
    });

    const fargateTaskDefinitionSchema = new ecs.FargateTaskDefinition(
      this,
      'fargateTaskDefinitionSchema',
      {
        memoryLimitMiB: 512,
        cpu: 256
      }
    );

    const containerSchema = fargateTaskDefinitionSchema.addContainer('containerSchema', {
      // Use an image from DockerHub
      image: ecs.ContainerImage.fromRegistry('confluentinc/cp-schema-registry:5.3.0'),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'ecs-msk-schema' }),
      environment: {
        SCHEMA_REGISTRY_KAFKASTORE_BOOTSTRAP_SERVERS:
          'PLAINTEXT://b-2.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092,b-3.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092,b-1.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092',
        SCHEMA_REGISTRY_LISTENERS: 'http://0.0.0.0:8081',
        SCHEMA_REGISTRY_HOST_NAME: 'schema',
      },
    });

    containerSchema.addPortMappings({
      containerPort: 8081,
    });

    const serviceSchema = new ecs.FargateService(this, 'serviceSchema', {
      cluster: ecsCluster,
      taskDefinition: fargateTaskDefinitionSchema,
      desiredCount: 1,
      securityGroups: [
        ec2.SecurityGroup.fromSecurityGroupId(this, 'sgServiceSchema', vpc.vpcDefaultSecurityGroup)
      ],
      cloudMapOptions: {
        name: 'schema',
        failureThreshold: 2,
        cloudMapNamespace,
      },
    });

    const fargateTaskDefinitionRest = new ecs.FargateTaskDefinition(
      this,
      'fargateTaskDefinitionRest',
      {
        memoryLimitMiB: 512,
        cpu: 256
      }
    );

    const containerRest = fargateTaskDefinitionRest.addContainer('containerRest', {
      // Use an image from DockerHub
      image: ecs.ContainerImage.fromRegistry('confluentinc/cp-kafka-rest:latest'),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'ecs-msk-rest' }),
      environment: {
        KAFKA_REST_BOOTSTRAP_SERVERS:
          'PLAINTEXT://b-2.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092,b-3.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092,b-1.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092',
        KAFKA_REST_LISTENERS: 'http://0.0.0.0:8082',
        KAFKA_REST_HOST_NAME: 'rest',
        KAFKA_REST_SCHEMA_REGISTRY_URL: 'http://schema.msk:8081/'
      }
    });

    containerRest.addPortMappings({
      containerPort: 8082,
    });

    const serviceRest = new ecs.FargateService(this, 'serviceRest', {
      cluster: ecsCluster,
      taskDefinition: fargateTaskDefinitionRest,
      desiredCount: 1,
      securityGroups: [
        ec2.SecurityGroup.fromSecurityGroupId(this, 'sgServiceRest', vpc.vpcDefaultSecurityGroup)
      ],
      cloudMapOptions: {
        name: 'rest',
        failureThreshold: 2,
        cloudMapNamespace,
      }
    });


    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true,
    });

    const listenerSchema = lb.addListener('listenerSchema', {
      port: 8081,
      protocol: elbv2.ApplicationProtocol.HTTP,
    });
    const targetGroupSchema = listenerSchema.addTargets('Schema', {
      port: 8081,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [serviceSchema],
    });

    const listenerRest = lb.addListener('listenerRest', {
      port: 8082,
      protocol: elbv2.ApplicationProtocol.HTTP,
    });
    const targetGroupRest = listenerRest.addTargets('Rest', {
      port: 8082,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [serviceRest],
    });

    const lambdaRole = new iam.Role(this, 'msk-LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaMSKExecutionRole'
      )
    );

    const fnStd = new lambda.Function(this, 'fnStd', {
      runtime: lambda.Runtime.NODEJS_12_X,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(20),
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          // Iterate through keys
          for (let key in event.records) {
            console.log('Key: ', key)
            // Iterate through records
            event.records[key].map((record) => {
              console.log('Record: ', record)
              // Decode base64
              const msg = Buffer.from(record.value, 'base64').toString()
              console.log('Message:', msg)
            }) 
          }
        }
      `),
    });

    new lambda.EventSourceMapping(this, 'EventSourceMapping', {
      eventSourceArn: mskCluster.ref,
      target: fnStd,
      kafkaTopic: 'AWSKafkaTutorialTopic',
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
    });

  }
}
