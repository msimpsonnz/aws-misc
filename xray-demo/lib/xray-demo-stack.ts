import * as cdk from '@aws-cdk/core';
import * as dynamo from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as lambdanode from '@aws-cdk/aws-lambda-nodejs';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as synthetics from '@aws-cdk/aws-synthetics';
import * as logs from	'@aws-cdk/aws-logs';

export class XrayDemoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamo.Table(this, 'table', {
      partitionKey: {
        name: "pk",
        type: dynamo.AttributeType.STRING
      },
      sortKey: {
        name: "sk",
        type: dynamo.AttributeType.STRING
      },
      billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

    const fnDynamo = new lambdanode.NodejsFunction(this, 'fnDynamo', {
      entry: './func/RecordHandler/index.js',
      handler: 'handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      environment: {
        AWS_DYNAMODB_TABLE: table.tableName,
        FAIL: false.toString()
      },
      tracing: lambda.Tracing.ACTIVE
    });
    table.grantReadWriteData(fnDynamo);

    const api = new apigateway.LambdaRestApi(this, 'obs-demo', {
      handler: fnDynamo,
      deployOptions: {
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        metricsEnabled: true,
        tracingEnabled: true
      }
    });

    new logs.LogRetention(this, 'apiLogGroup', {
      logGroupName: `API-Gateway-Execution-Logs_${api.restApiId}/${api.deploymentStage.stageName}`,
      retention: logs.RetentionDays.THREE_MONTHS
    })


    const canaryGET = new synthetics.Canary(this, 'canaryGET', {
      runtime: synthetics.Runtime.SYNTHETICS_1_0,
      schedule: synthetics.Schedule.rate(cdk.Duration.minutes(8)),
      test: synthetics.Test.custom({
        code: lambda.Code.fromAsset('./func/canary'),
        handler: 'index.handler',
      }),
    });

    const canaryPOST = new synthetics.Canary(this, 'canaryPOST', {
      runtime: synthetics.Runtime.SYNTHETICS_1_0,
      schedule: synthetics.Schedule.rate(cdk.Duration.minutes(60)),
      test: synthetics.Test.custom({
        code: lambda.Code.fromAsset('./func/canary1'),
        handler: 'index.handler',
      }),
    });


  }
}
