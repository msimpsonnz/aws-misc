import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import * as amazonmq from '@aws-cdk/aws-amazonmq';
import * as lambda from '@aws-cdk/aws-lambda';

export class MqDemoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const mqSecret = new secretsmanager.Secret(this, 'mqSecret', {
      generateSecretString: {
        excludeCharacters: ' ;+%{}' + '@\'"`/\\#',
        excludePunctuation: true,
        passwordLength: 12,
        secretStringTemplate: JSON.stringify({ username: 'amazonmqadmin' }),
        generateStringKey: 'password',
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const activeMqBroker = new amazonmq.CfnBroker(this, 'activeMqBroker', {
      autoMinorVersionUpgrade: false,
      brokerName: 'activeMqBroker',
      deploymentMode: 'SINGLE_INSTANCE',
      engineType: 'ActiveMQ',
      engineVersion: '5.15.0',
      hostInstanceType: 'mq.t2.micro',
      publiclyAccessible: true,
      users: [
        {
          consoleAccess: true,
          groups: ['myGroup'],
          username: mqSecret.secretValueFromJson('username').toString(),
          password: mqSecret.secretValueFromJson('password').toString(),
        },
      ],
    });

    const roleFnActiveMQConsumer = new iam.Role(
      this,
      'roleFnActiveMQConsumer',
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      }
    );

    roleFnActiveMQConsumer.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole'
      )
    );

    roleFnActiveMQConsumer.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ['*'],
        actions: [
          'mq:DescribeBroker',
          'secretsmanager:GetSecretValue',
          'ec2:CreateNetworkInterface',
          'ec2:DescribeNetworkInterfaces',
          'ec2:DescribeVpcs',
          'ec2:DeleteNetworkInterface',
          'ec2:DescribeSubnets',
          'ec2:DescribeSecurityGroups',
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
      })
    );

    const fnActiveMQConsumer = new lambda.Function(this, 'fnActiveMQConsumer', {
      runtime: lambda.Runtime.NODEJS_12_X,
      role: roleFnActiveMQConsumer,
      timeout: cdk.Duration.seconds(20),
      handler: 'index.handler',
      code: lambda.Code.fromInline(
        `
        exports.handler = async function(event, context) {
          console.log(JSON.stringify(event));
          return {
            statusCode: 200,
          };
        }
        `
      ),
      vpc: ec2.Vpc.fromLookup(this, 'vpc', {
        isDefault: true,
      }),
    });

    // MQ does not have CFN support for mapping Lambda at the moment
    // new lambda.EventSourceMapping(this, 'EventSourceMapping', {
    //   eventSourceArn: mskCluster.ref,
    //   target: fnStd,
    //   kafkaTopic: 'AWSKafkaTutorialTopic',
    //   startingPosition: lambda.StartingPosition.TRIM_HORIZON,
    // });

    const rabbitMqBroker = new amazonmq.CfnBroker(this, 'rabbitMqBroker', {
      autoMinorVersionUpgrade: false,
      brokerName: 'rabbitMqBroker',
      deploymentMode: 'SINGLE_INSTANCE',
      engineType: 'RabbitMQ',
      engineVersion: '3.8.6',
      hostInstanceType: 'mq.t3.micro',
      publiclyAccessible: true,
      users: [
        {
          username: mqSecret.secretValueFromJson('username').toString(),
          password: mqSecret.secretValueFromJson('password').toString(),
        },
      ],
    });

    const fnRabbitHello = new lambda.Function(this, 'fnRabbitHello', {
      code: lambda.Code.fromAsset('./function/rabbitPublish', {
        bundling: {
          image: lambda.Runtime.GO_1_X.bundlingDockerImage,
          command: [
            'bash',
            '-c',
            [
              //'cd /asset-input',
              'go get github.com/aws/aws-lambda-go/lambda',
              'go get github.com/streadway/amqp',
              'go build -o /asset-output/main /asset-input/main.go',
              //'cp /asset-input/bin/main /asset-output/bin',
            ].join(' && '),
          ],
          user: 'root',
        },
        exclude: ['!bin'],
      }),
      runtime: lambda.Runtime.GO_1_X,
      handler: 'main',
      environment: {
        AWS_MQ_HOSTNAME_RABBIT: rabbitMqBroker.attrAmqpEndpoints[0],
        AWS_MQ_HOSTNAME_MQ: activeMqBroker.attrStompEndpoints[0],
        AWS_MQ_USER: mqSecret.secretValueFromJson('username').toString(),
        AWS_MQ_PASSWORD: mqSecret.secretValueFromJson('password').toString(),
      },
    });

    const fnRabbit2Active = new lambda.Function(this, 'fnRabbit2Active', {
      code: lambda.Code.fromAsset('./function/rabbit2active', {
        bundling: {
          image: lambda.Runtime.GO_1_X.bundlingDockerImage,
          command: [
            'bash',
            '-c',
            [
              //'cd /asset-input',
              'go get github.com/aws/aws-lambda-go/lambda',
              'go get github.com/streadway/amqp',
              'go get github.com/go-stomp/stomp',
              'go build -o /asset-output/main /asset-input/main.go',
              //'cp /asset-input/bin/main /asset-output/bin',
            ].join(' && '),
          ],
          user: 'root',
        },
        exclude: ['!bin'],
      }),
      runtime: lambda.Runtime.GO_1_X,
      handler: 'main',
      environment: {
        AWS_MQ_HOSTNAME_RABBIT: rabbitMqBroker.attrAmqpEndpoints[0],
        AWS_MQ_HOSTNAME_MQ: activeMqBroker.attrStompEndpoints[0],
        AWS_MQ_USER: mqSecret.secretValueFromJson('username').toString(),
        AWS_MQ_PASSWORD: mqSecret.secretValueFromJson('password').toString(),
      },
    });
  }
}
