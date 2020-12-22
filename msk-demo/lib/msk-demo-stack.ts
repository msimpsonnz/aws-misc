import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as msk from '@aws-cdk/aws-msk';
import * as ecs from '@aws-cdk/aws-ecs';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as cloudmap from '@aws-cdk/aws-servicediscovery';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cloud9 from '@aws-cdk/aws-cloud9';


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

    // const mskClusterV1 = new msk.CfnCluster(this, 'mskClusterV1', {
    //   clusterName: 'msk-demo-v1',
    //   brokerNodeGroupInfo: {
    //     clientSubnets: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE })
    //       .subnetIds,
    //     instanceType: 'kafka.t3.small',
    //     brokerAzDistribution: 'DEFAULT',
    //   },
    //   numberOfBrokerNodes: 4,
    //   kafkaVersion: '1.1.1',
    //   encryptionInfo: {
    //     encryptionInTransit: {
    //       clientBroker: 'TLS_PLAINTEXT',
    //     },
    //   },
    //   // configurationInfo: {
    //   //   arn:
    //   //     'arn:aws:kafka:ap-southeast-2:383358879677:configuration/msk-demo-config/75dc0e13-0c54-43e9-b06d-dd71243caf48-3',
    //   //   revision: 1,
    //   // },
    // });

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
        arn:
          'arn:aws:kafka:ap-southeast-2:383358879677:configuration/msk-demo-config/75dc0e13-0c54-43e9-b06d-dd71243caf48-3',
        revision: 1,
      },
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

    const cloudMapNamespace = new cloudmap.PrivateDnsNamespace(
      this,
      'cloudMapNamespace',
      {
        name: 'msk',
        vpc,
      }
    );

    const ecsCluster = new ecs.Cluster(this, 'Cluster', {
      vpc: vpc,
    });

    //######

    const fargateTaskDefinitionShell = new ecs.FargateTaskDefinition(
      this,
      'fargateTaskDefinitionShell',
      {
        memoryLimitMiB: 512,
        cpu: 256,
      }
    );

    const containerShell = fargateTaskDefinitionShell.addContainer(
      'containerShell',
      {
        // Use an image from DockerHub
        image: ecs.ContainerImage.fromAsset('./ssh'),
        logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'ecs-msk-shell' }),
        command: [
          '/bin/sh',
          '-c',
          'SSH_ENABLED=true /usr/local/bin/docker-entrypoint.sh && sleep infinity',
        ],
      }
    );

    containerShell.addPortMappings({
      containerPort: 22,
    });

    const serviceShell = new ecs.FargateService(this, 'serviceShell', {
      cluster: ecsCluster,
      taskDefinition: fargateTaskDefinitionShell,
      desiredCount: 1,
      securityGroups: [
        ec2.SecurityGroup.fromSecurityGroupId(
          this,
          'sgServiceShell',
          vpc.vpcDefaultSecurityGroup
        ),
      ],
      cloudMapOptions: {
        name: 'shell',
        failureThreshold: 2,
        cloudMapNamespace,
      },
    });

    //######

    const fargateTaskDefinitionSchema = new ecs.FargateTaskDefinition(
      this,
      'fargateTaskDefinitionSchema',
      {
        memoryLimitMiB: 512,
        cpu: 256,
      }
    );

    const containerSchema = fargateTaskDefinitionSchema.addContainer(
      'containerSchema',
      {
        // Use an image from DockerHub
        image: ecs.ContainerImage.fromRegistry(
          'confluentinc/cp-schema-registry'
        ),
        logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'ecs-msk-schema' }),
        environment: {
          SCHEMA_REGISTRY_KAFKASTORE_BOOTSTRAP_SERVERS:
            'SSL://b-3.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9094,b-2.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9094,b-4.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9094',
          SCHEMA_REGISTRY_KAFKASTORE_SECURITY_PROTOCOL: 'SSL',
          SCHEMA_REGISTRY_LISTENERS: 'http://0.0.0.0:8081',
          SCHEMA_REGISTRY_HOST_NAME: 'schema',
          SCHEMA_REGISTRY_DEBUG: 'true',
          SCHEMA_REGISTRY_ACCESS_CONTROL_ALLOW_METHODS: 'GET,POST,PUT,OPTIONS',
          SCHEMA_REGISTRY_ACCESS_CONTROL_ALLOW_ORIGIN: '*',
        },
      }
    );

    containerSchema.addPortMappings({
      containerPort: 8081,
    });

    const serviceSchema = new ecs.FargateService(this, 'serviceSchema', {
      cluster: ecsCluster,
      taskDefinition: fargateTaskDefinitionSchema,
      desiredCount: 1,
      securityGroups: [
        ec2.SecurityGroup.fromSecurityGroupId(
          this,
          'sgServiceSchema',
          vpc.vpcDefaultSecurityGroup
        ),
      ],
      cloudMapOptions: {
        name: 'schema',
        failureThreshold: 2,
        cloudMapNamespace,
      },
    });

    //######

    const fargateTaskDefinitionSchemaUI = new ecs.FargateTaskDefinition(
      this,
      'fargateTaskDefinitionSchemaUI',
      {
        memoryLimitMiB: 512,
        cpu: 256,
      }
    );

    const containerSchemaUI = fargateTaskDefinitionSchemaUI.addContainer(
      'containerSchemaUI',
      {
        // Use an image from DockerHub
        image: ecs.ContainerImage.fromRegistry('landoop/schema-registry-ui'),
        logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'ecs-msk-schema-ui' }),
        environment: {
          SCHEMAREGISTRY_URL: 'http://schema.msk:8081',
          PROXY: 'true'
        },
      }
    );

    containerSchemaUI.addPortMappings({
      containerPort: 8000,
    });

    const serviceSchemaUI = new ecs.FargateService(this, 'serviceSchemaUI', {
      cluster: ecsCluster,
      taskDefinition: fargateTaskDefinitionSchemaUI,
      desiredCount: 1,
      securityGroups: [
        ec2.SecurityGroup.fromSecurityGroupId(
          this,
          'sgServiceSchemaUI',
          vpc.vpcDefaultSecurityGroup
        ),
      ],
      cloudMapOptions: {
        name: 'schema-ui',
        failureThreshold: 2,
        cloudMapNamespace,
      },
    });

    //######

    const fargateTaskDefinitionRest = new ecs.FargateTaskDefinition(
      this,
      'fargateTaskDefinitionRest',
      {
        memoryLimitMiB: 512,
        cpu: 256,
      }
    );

    const containerRest = fargateTaskDefinitionRest.addContainer(
      'containerRest',
      {
        // Use an image from DockerHub
        image: ecs.ContainerImage.fromRegistry(
          'confluentinc/cp-kafka-rest:latest'
        ),
        logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'ecs-msk-rest' }),
        environment: {
          KAFKA_REST_BOOTSTRAP_SERVERS:
            'PLAINTEXT://b-2.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092,b-3.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092,b-1.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092',
          KAFKA_REST_LISTENERS: 'http://0.0.0.0:8082',
          KAFKA_REST_HOST_NAME: 'rest',
          KAFKA_REST_SCHEMA_REGISTRY_URL: 'http://schema.msk:8081/',
        },
      }
    );

    containerRest.addPortMappings({
      containerPort: 8082,
    });

    const serviceRest = new ecs.FargateService(this, 'serviceRest', {
      cluster: ecsCluster,
      taskDefinition: fargateTaskDefinitionRest,
      desiredCount: 1,
      securityGroups: [
        ec2.SecurityGroup.fromSecurityGroupId(
          this,
          'sgServiceRest',
          vpc.vpcDefaultSecurityGroup
        ),
      ],
      cloudMapOptions: {
        name: 'rest',
        failureThreshold: 2,
        cloudMapNamespace,
      },
    });

    //######

    const fargateTaskDefinitionSQL = new ecs.FargateTaskDefinition(
      this,
      'fargateTaskDefinitionSQL',
      {
        memoryLimitMiB: 512,
        cpu: 256,
      }
    );

    const containerSQL = fargateTaskDefinitionSQL.addContainer('containerSQL', {
      // Use an image from DockerHub
      image: ecs.ContainerImage.fromRegistry(
        'confluentinc/cp-ksql-server:latest'
      ),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'ecs-msk-sql' }),
      environment: {
        KSQL_BOOTSTRAP_SERVERS:
          'PLAINTEXT://b-2.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092,b-3.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092,b-1.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092',
        KSQL_LISTENERS: 'http://0.0.0.0:8088',
        KSQL_KSQL_SERVICE_ID: 'sql',
        KSQL_KSQL_SCHEMA_REGISTRY_URL: 'http://schema.msk:8081/',
      },
    });

    containerSQL.addPortMappings({
      containerPort: 8088,
    });

    const serviceSQL = new ecs.FargateService(this, 'serviceSQL', {
      cluster: ecsCluster,
      taskDefinition: fargateTaskDefinitionSQL,
      desiredCount: 1,
      securityGroups: [
        ec2.SecurityGroup.fromSecurityGroupId(
          this,
          'sgServiceSQL',
          vpc.vpcDefaultSecurityGroup
        ),
      ],
      cloudMapOptions: {
        name: 'sql',
        failureThreshold: 2,
        cloudMapNamespace,
      },
    });

    //######

    // const fargateTaskDefinitionConnect = new ecs.FargateTaskDefinition(
    //   this,
    //   'fargateTaskDefinitionConnect',
    //   {
    //     memoryLimitMiB: 512,
    //     cpu: 256,
    //   }
    // );

    // const containerConnect = fargateTaskDefinitionConnect.addContainer('containerConnect', {
    //   // Use an image from DockerHub
    //   image: ecs.ContainerImage.fromRegistry(
    //     'confluentinc/cp-kafka-connect:latest'
    //   ),
    //   logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'ecs-msk-connect' }),
    //   environment: {
    //     CONNECT_BOOTSTRAP_SERVERS:
    //       'PLAINTEXT://b-2.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092,b-3.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092,b-1.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092',
    //     CONNECT_GROUP_ID: 'kafka-connect-group',
    //     CONNECT_CONFIG_STORAGE_TOPIC: 'kafka-connect-config',
    //     CONNECT_OFFSET_STORAGE_TOPIC: 'kafka-connect-offset',
    //     CONNECT_STATUS_STORAGE_TOPIC: 'kafka-connect-status',
    //     CONNECT_KEY_CONVERTER: 'io.confluent.connect.avro.AvroConverter',
    //     CONNECT_VALUE_CONVERTER: 'io.confluent.connect.avro.AvroConverter',
    //     CONNECT_INTERNAL_KEY_CONVERTER: 'org.apache.kafka.connect.json.JsonConverter',
    //     CONNECT_INTERNAL_VALUE_CONVERTER: 'org.apache.kafka.connect.json.JsonConverter',
    //     CONNECT_REST_ADVERTISED_HOST_NAME: 'kafka-connect',
    //     CONNECT_KEY_CONVERTER_SCHEMA_REGISTRY_URL: 'http://schema.msk:8081/',
    //     CONNECT_VALUE_CONVERTER_SCHEMA_REGISTRY_URL: 'http://schema.msk:8081/'
    //   },
    // });

    // containerConnect.addPortMappings({
    //   containerPort: 8083,
    // });

    // const serviceConnect = new ecs.FargateService(this, 'serviceConnect', {
    //   cluster: ecsCluster,
    //   taskDefinition: fargateTaskDefinitionConnect,
    //   desiredCount: 1,
    //   securityGroups: [
    //     ec2.SecurityGroup.fromSecurityGroupId(
    //       this,
    //       'sgServiceConnect',
    //       vpc.vpcDefaultSecurityGroup
    //     ),
    //   ],
    //   cloudMapOptions: {
    //     name: 'kafka-connect',
    //     failureThreshold: 2,
    //     cloudMapNamespace,
    //   },
    // });

    //######

    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true,
    });

    const listenerSchemaUI = lb.addListener('listenerSchemaUI', {
      port: 8000,
      protocol: elbv2.ApplicationProtocol.HTTP,
    });
    const targetGroupSchemaUI = listenerSchemaUI.addTargets('SchemaUI', {
      port: 8000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [serviceSchemaUI],
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

    // const listenerSQL = lb.addListener('listenerSQL', {
    //   port: 8088,
    //   protocol: elbv2.ApplicationProtocol.HTTP,
    // });
    // const targetGroupSQL = listenerSQL.addTargets('SQL', {
    //   port: 8088,
    //   protocol: elbv2.ApplicationProtocol.HTTP,
    //   targets: [serviceSQL],
    // });

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

    // const c9env = new cloud9.Ec2Environment(this, 'Cloud9Env', {
    //   vpc,
    //   instanceType: new ec2.InstanceType('t3.large'),
    //   ownerarn: 
    // });
        
    //new cdk.CfnOutput(this, 'URL', { value: c9env.ideUrl });

    const c9env = new cloud9.CfnEnvironmentEC2(this, 'Cloud9Env', {
      instanceType: 't3.large',
      ownerArn: this.node.tryGetContext('login'),
      subnetId: vpc.publicSubnets[0].subnetId
    })


  }
}
