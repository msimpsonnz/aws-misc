import { aws_apigateway, aws_lambda, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class ApiKeyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const lambda = new aws_lambda.Function(this, 'fnFifo', {
      runtime: aws_lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      timeout: Duration.seconds(20),
      code: aws_lambda.Code.fromInline(`
        exports.handler = async function(event) { 
          console.log(JSON.stringify(event));
          var res = {
            "statusCode": 200,
            "headers": {
                "Content-Type": "*/*"
            }
          };
          return res;
        }`),
    });

    const integration = new aws_apigateway.LambdaIntegration(lambda);

    const api = new aws_apigateway.RestApi(this, 'hello-api');

    const v1 = api.root.addResource('v1');
    const echo = v1.addResource('echo');
    const echoMethod = echo.addMethod('GET', integration, {
      apiKeyRequired: true,
    });

    const plan = api.addUsagePlan('UsagePlan', {
      name: 'Easy',
      throttle: {
        rateLimit: 10,
        burstLimit: 2,
      },
    });

    const key = api.addApiKey('ApiKey');
    plan.addApiKey(key);

    api.url
  }
}
