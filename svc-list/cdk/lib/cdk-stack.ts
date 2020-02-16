import events = require('@aws-cdk/aws-events');
import targets = require('@aws-cdk/aws-events-targets');
import cdk = require('@aws-cdk/core');
import lambda = require('@aws-cdk/aws-lambda');
import { SqsEventSource, SnsEventSource } from '@aws-cdk/aws-lambda-event-sources';
import dynamodb = require('@aws-cdk/aws-dynamodb');
import sqs = require('@aws-cdk/aws-sqs');
import sns = require('@aws-cdk/aws-sns');

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dynamodbTable = new dynamodb.Table(this, 'service-list', {
      tableName: 'service-list',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'ItemType', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    dynamodbTable.addGlobalSecondaryIndex({
      indexName: 'service-list-gsi',
      partitionKey: { name: 'ItemType', type: dynamodb.AttributeType.STRING }
    });

    const sqsNotify = new sqs.Queue(this, 'service-list-queue', {
      visibilityTimeout: cdk.Duration.seconds(500)
    });

    const snsTopic = new sns.Topic(this, 'service-list-topic');

    const email = this.node.tryGetContext("snsEmail");
    new sns.Subscription(this, 'admin-alert', {
      topic: snsTopic,
      endpoint: email,
      protocol: sns.SubscriptionProtocol.EMAIL_JSON
    });

    const lambdaFnCrawl = new lambda.Function(this, 'service-list-crawl-aws', {
      runtime: lambda.Runtime.N,
      code: new lambda.AssetCode("../ServiceList.App.AwsCrawl/bin/Release/netcoreapp2.1/ServiceList.App.AwsCrawl.zip"),
      handler: 'ServiceList.App.AwsCrawl::ServiceList.App.AwsCrawl.Function::FunctionHandler',
      timeout: cdk.Duration.seconds(300),
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

    const lambdaFnNotify = new lambda.Function(this, 'service-list-crawl-notify', {
      code: new lambda.AssetCode("../ServiceList.App.Notify/bin/Release/netcoreapp2.1/ServiceList.App.Notify.zip"),
      handler: 'ServiceList.App.Notify::ServiceList.App.Notify.Function::FunctionHandler',
      runtime: lambda.Runtime.DOTNET_CORE_2_1,
      timeout: cdk.Duration.seconds(300),
      environment: {
        AWS_SNS_TOPIC: snsTopic.topicArn
      }
    });

    lambdaFnNotify.addEventSource(new SqsEventSource(sqsNotify));
    snsTopic.grantPublish(lambdaFnNotify);

    const lambdaFnUpdate = new lambda.Function(this, 'service-list-crawl-update', {
      code: new lambda.AssetCode("../ServiceList.App.Update/bin/Release/netcoreapp2.1/ServiceList.App.Update.zip"),
      handler: 'ServiceList.App.Update::ServiceList.App.Update.Function::FunctionHandler',
      runtime: lambda.Runtime.DOTNET_CORE_2_1,
      timeout: cdk.Duration.seconds(300),
      environment: {
      }
    });

    lambdaFnUpdate.addEventSource(new SnsEventSource(snsTopic));
    dynamodbTable.grantFullAccess(lambdaFnUpdate);

  }
}
