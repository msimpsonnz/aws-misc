import events = require('@aws-cdk/aws-events');
import targets = require('@aws-cdk/aws-events-targets');
import cdk = require('@aws-cdk/cdk');
import lambda = require('@aws-cdk/aws-lambda');
import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';
import dynamodb = require('@aws-cdk/aws-dynamodb');
import sqs = require('@aws-cdk/aws-sqs');

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dynamodbTable = new dynamodb.Table(this, 'service-list', {
      tableName: 'service-list',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.String },
      sortKey: { name: 'ItemType', type: dynamodb.AttributeType.String },
      billingMode: dynamodb.BillingMode.PayPerRequest
    });

    dynamodbTable.addGlobalSecondaryIndex({
      indexName: 'service-list-gsi',
      partitionKey: { name: 'ItemType', type: dynamodb.AttributeType.String }
    });

    const sqsNotify = new sqs.Queue(this, 'service-list-queue', {
      visibilityTimeoutSec: 500
    });

    const lambdaFnCrawl = new lambda.Function(this, 'service-list-crawl-aws', {
      runtime: lambda.Runtime.DotNetCore21,
      code: new lambda.AssetCode("../ServiceList.App.AwsCrawl/src/ServiceList.App.AwsCrawl/bin/Release/netcoreapp2.1/ServiceList.App.AwsCrawl.zip"),
      handler: 'ServiceList.App.AwsCrawl::ServiceList.App.AwsCrawl.Function::FunctionHandler',
      timeout: 300,
      environment: {
        AWS_SQS_URL: sqsNotify.queueUrl
      }
    });

    dynamodbTable.grantFullAccess(lambdaFnCrawl);
    sqsNotify.grantSendMessages(lambdaFnCrawl);

    const rule = new events.Rule(this, 'Rule', {
      schedule: {
        expressionString: 'cron(0 18 ? * FRI *)'
      }
    });

    rule.addTarget(new targets.LambdaFunction(lambdaFnCrawl));

    const lambdaFnUpdate = new lambda.Function(this, 'service-list-crawl-notify', {
      code: new lambda.AssetCode("../ServiceList.App.AwsCrawl/src/ServiceList.App.AwsCrawl/bin/Release/netcoreapp2.1/ServiceList.App.AwsCrawl.zip"),
      handler: 'ServiceList.App.AwsCrawl::ServiceList.App.AwsCrawl.Function::FunctionHandler',
      runtime: lambda.Runtime.DotNetCore21,
      environment: {
        AWS_SQS_URL: sqsNotify.queueUrl
      }
    });

    lambdaFnUpdate.addEventSource(new SqsEventSource(sqsNotify));



  }
}
