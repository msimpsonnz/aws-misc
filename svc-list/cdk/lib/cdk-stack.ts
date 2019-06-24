import events = require('@aws-cdk/aws-events');
import targets = require('@aws-cdk/aws-events-targets');
import cdk = require('@aws-cdk/cdk');
import lambda = require('@aws-cdk/aws-lambda');

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    


    const lambdaFn = new lambda.Function(this, 'service-list-crawl-aws', {
      code: new lambda.AssetCode("../ServiceList.App.AwsCrawl/src/ServiceList.App.AwsCrawl/bin/Release/netcoreapp2.1/ServiceList.App.AwsCrawl.zip"),
      handler: 'ServiceList.App.AwsCrawl::ServiceList.App.AwsCrawl.Function::FunctionHandler',
      timeout: 300,
      runtime: lambda.Runtime.DotNetCore21,
    });

    // const rule = new events.Rule(this, 'Rule', {
    //   schedule: 'cron(0 18 ? * MON-FRI *)',
    // });

    // rule.addTarget(new targets.LambdaFunction(lambdaFn));

  }
}
