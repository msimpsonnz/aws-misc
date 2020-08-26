import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as iot from '@aws-cdk/aws-iot';
import * as lambda from '@aws-cdk/aws-lambda';
import * as lambdanode from '@aws-cdk/aws-lambda-nodejs';

export class IotJobQueueStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'table', {
      partitionKey: {
        name: "pk",
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: "sk",
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    const role_fnIotJobProcessor = new iam.Role(
      this,
      'role_fnIotJobProcessor',
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      }
    );

    role_fnIotJobProcessor.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole'
      )
    );

    role_fnIotJobProcessor.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ['*'],
        actions: [
          'iot:DescribeThing',
          'iot:CreateJob'
        ],
      })
    );

    const fnIotJobProcessor = new lambdanode.NodejsFunction(this, "fnIotJobProcessor", {
      role: role_fnIotJobProcessor,
      entry: "./func/iotjobprocessor/index.ts",
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: {
        AWS_DYNAMODB_TABLE: table.tableName,
        AWS_IOT_ENDPOINT: 'iot.ap-southeast-2.amazonaws.com'
      }
    });
    table.grantReadData(fnIotJobProcessor);
    fnIotJobProcessor.addPermission('iotRule', {
      principal: new iam.ServicePrincipal('iot.amazonaws.com'),
    })

    const fnIotJobUpdater = new lambdanode.NodejsFunction(this, "fnIotJobUpdater", {
      role: role_fnIotJobProcessor,
      entry: "./func/iotjobupdater/index.ts",
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: {
        AWS_DYNAMODB_TABLE: table.tableName
      }
    });
    table.grantReadWriteData(fnIotJobUpdater);
    fnIotJobUpdater.addPermission('iotRule', {
      principal: new iam.ServicePrincipal('iot.amazonaws.com'),
    })

    // IoT Rules
    const iotRuleThingConnected = new iot.CfnTopicRule(this, 'iotRuleThingConnected', {
      topicRulePayload: {
        actions: [
          {
            lambda: {
              functionArn: fnIotJobProcessor.functionArn
            }
          }
        ],
        ruleDisabled: false,
        sql: "SELECT * FROM '$aws/events/presence/connected/+'"
      },
      ruleName: 'iotRuleThingConnected',
      
    });

    const iotRuleJobCompleted = new iot.CfnTopicRule(this, 'iotRuleJobCompleted', {
      topicRulePayload: {
        actions: [
          {
            lambda: {
              functionArn: fnIotJobUpdater.functionArn
            }
          }
        ],
        ruleDisabled: false,
        sql: "SELECT * FROM '$aws/events/job/#'"
      },
      ruleName: 'iotRuleJobCompleted'
    });

    new cdk.CfnOutput(this, 'output-table', {
      value: table.tableName
    })

  }
}
