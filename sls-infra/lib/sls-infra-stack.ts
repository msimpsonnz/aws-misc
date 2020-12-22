import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as efs from '@aws-cdk/aws-efs';
import * as lambda from '@aws-cdk/aws-lambda';
import * as destinations from '@aws-cdk/aws-lambda-destinations';
import * as events from '@aws-cdk/aws-events';
import * as eventsTargets from '@aws-cdk/aws-events-targets';
import * as apigw from '@aws-cdk/aws-apigatewayv2';
import * as cloud9 from '@aws-cdk/aws-cloud9';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks';
import * as sns from '@aws-cdk/aws-sns';

export class SlsInfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC setup
    const vpc = new ec2.Vpc(this, 'sls-demo-vpc', {
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

    // Cloud9 for Demo
    const c9env = new cloud9.CfnEnvironmentEC2(this, 'Cloud9Env', {
      name: 'cloud9-sls-demo',
      instanceType: 't3.large',
      
      automaticStopTimeMinutes: 30,
      ownerArn: this.node.tryGetContext('login'),
      subnetId: vpc.publicSubnets[0].subnetId,
    });

    // EFS
    const fileSystem = new efs.FileSystem(this, 'Efs', { vpc });

    const accessPoint = fileSystem.addAccessPoint('AccessPoint', {
      // set /export/lambda as the root of the access point
      path: '/export/lambda',
      // as /export/lambda does not exist in a new efs filesystem, the efs will create the directory with the following createAcl
      createAcl: {
        ownerUid: '1001',
        ownerGid: '1001',
        permissions: '750',
      },
      // enforce the POSIX identity so lambda function will access with this identity
      posixUser: {
        uid: '1001',
        gid: '1001',
      },
    });

    // EventBridge Event Bus for custom events
    const eventBusPri = new events.EventBus(this, 'eventBusPri');

    // EventBridge Archive
    const eventBusPriArchive = new events.CfnArchive(
      this,
      'eventBusPriArchive',
      {
        sourceArn: eventBusPri.eventBusArn,
      }
    );

    // Lambda Function to publish to EventBridge
    const fnEventPub = new lambda.Function(this, 'fnEventPub', {
      runtime: lambda.Runtime.NODEJS_12_X,
      timeout: cdk.Duration.seconds(20),
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const fs = require('fs')
        exports.handler = async function(event, context) {
          //eval('console.log("eval should not be allowed!!")');
          console.log(JSON.stringify(event));
          const fileName = '/mnt/msg/input/' + event.id + '.csv';
          console.log(fileName);
          fs.writeFileSync(fileName, event.detail.payload);
          console.log('write EFS done');
          return {
            statusCode: 200,
          };
        }
      `),
      vpc: vpc,
      filesystem: lambda.FileSystem.fromEfsAccessPoint(accessPoint, '/mnt/msg'),
      onSuccess: new destinations.EventBridgeDestination(eventBusPri),
      onFailure: new destinations.EventBridgeDestination(eventBusPri),
      environment: {
        NODE_OPTIONS: '--disallow-code-generation-from-strings'
      }
    });

    new events.Rule(this, 'eventRuleFn', {
      eventBus: eventBusPri,
      eventPattern: {
        source: ["api.events"],
      },
      targets: [new eventsTargets.LambdaFunction(fnEventPub)],
    });


    // External facing HTTP API Gateway
    const apiHttpExt = new apigw.HttpApi(this, 'apiHttpExt');

    const roleApiHttpExt = new iam.Role(this, 'roleApiHttpExt', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com')
    });

    roleApiHttpExt.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [eventBusPri.eventBusArn],
        actions: ["events:PutEvents"],
      })
    );

    //Create the Integration
    const apiGatewayIntegration = new apigw.CfnIntegration(
      this,
      'apiGatewayIntegration',
      {
        apiId: apiHttpExt.httpApiId,
        integrationSubtype: 'EventBridge-PutEvents',
        integrationType: 'AWS_PROXY',
        payloadFormatVersion: '1.0',
        credentialsArn: roleApiHttpExt.roleArn,
        requestParameters: {
          Detail: '$request.body',
          DetailType: '$request.body.event_type',
          Source: 'api.events',
          EventBusName: eventBusPri.eventBusName
        }

      }
    );

    new apigw.CfnRoute(this, 'apiRouteSQS', {
      apiId: apiHttpExt.httpApiId,
      routeKey: 'POST /events',
      target: `integrations/${apiGatewayIntegration.ref}`
    });

    // Lambda for Prediction
    const fnPrediction = new lambda.Function(this, 'fnPrediction', {
      runtime: lambda.Runtime.PYTHON_3_7,
      timeout: cdk.Duration.seconds(20),
      handler: 'index.handler',
      code: lambda.Code.fromAsset('./functions/predict'),
      vpc: vpc,
      filesystem: lambda.FileSystem.fromEfsAccessPoint(accessPoint, '/mnt/msg'),
      environment: {
      }
    });

    // Create SNS FIFO topic
    const snsFifoTopic = SlsInfraStack.createFifoTopic(this, 'snsFifoTopic')


    const sfnTask = new tasks.LambdaInvoke(this, 'sfnTask', {
      lambdaFunction: fnPrediction,
      payload: sfn.TaskInput.fromDataAt('$.data'),
    });


    const sfnEvent = new sfn.StateMachine(this, 'sfnEvent', {
      definition: sfnTask,
      tracingEnabled: true,
    });

    // Event Rule
    const eventRuleSfn = new events.Rule(this, 'eventRuleSfn', {
      eventBus: eventBusPri,
      eventPattern: {
        source: ["lambda"],
      },
    });

    eventRuleSfn.addTarget(new eventsTargets.SfnStateMachine(sfnEvent, {
      input: events.RuleTargetInput.fromObject({ data: events.EventField.fromPath("$.detail.requestPayload") }),
    }));

  }

  public static createFifoTopic(stack: cdk.Stack, name: string) {
    if (!name.endsWith('.fifo')) name = name + '.fifo';
    const topic = new sns.Topic(stack, name, {
      topicName: name
    });
    
    const cfnTopic = topic.node.defaultChild as sns.CfnTopic
    cfnTopic.addPropertyOverride("FifoTopic", true);
    cfnTopic.addPropertyOverride("ContentBasedDeduplication", false);
    return topic;
  }

}
