import { aws_lambda, aws_lambda_destinations, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class S3NotifyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const fnEventLogger = new aws_lambda.Function(this, 'fnEventLogger', {
      runtime: aws_lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: aws_lambda.Code.fromInline(`
        exports.handler = async function(event) { 
          console.log(JSON.stringify(event));
        }
      `),
    });

    const fnS3Runner = new aws_lambda.Function(this, 'fnS3Runner', {
      runtime: aws_lambda.Runtime.NODEJS_12_X,
      //timeout: Duration.seconds(3),
      handler: 'index.handler',
      code: aws_lambda.Code.fromInline(`
        exports.handler = async function(event) { 
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      `),
      //onFailure: new aws_lambda_destinations.LambdaDestination(fnEventLogger)
    });

  }
}
