import events = require('@aws-cdk/aws-events');
import targets = require('@aws-cdk/aws-events-targets');
import cdk = require('@aws-cdk/cdk');
import lambda = require('@aws-cdk/aws-lambda');
import dynamodb = require('@aws-cdk/aws-dynamodb');

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


    const lambdaFn = new lambda.Function(this, 'service-list-crawl-aws', {
      code: new lambda.AssetCode("../ServiceList.App.AwsCrawl/src/ServiceList.App.AwsCrawl/bin/Release/netcoreapp2.1/ServiceList.App.AwsCrawl.zip"),
      handler: 'ServiceList.App.AwsCrawl::ServiceList.App.AwsCrawl.Function::FunctionHandler',
      timeout: 300,
      runtime: lambda.Runtime.DotNetCore21,
    });

    dynamodbTable.grantReadWriteData(lambdaFn);

    // const rule = new events.Rule(this, 'Rule', {
    //   schedule: 'cron(0 18 ? * MON-FRI *)',
    // });

    // rule.addTarget(new targets.LambdaFunction(lambdaFn));

  }
}
