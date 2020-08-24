import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
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
          'iot:*'
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
        AWS_SECRET_MGR_PS: 
        AWS_SQS_NAME: 
      }
    });
    table.grantReadWriteData(fnIotJobProcessor);



  }
}
