import sqs = require('@aws-cdk/aws-sqs');
import cdk = require('@aws-cdk/cdk');
//import dynamo = require('@aws-cdk/aws-dynamodb');
import lambda = require('@aws-cdk/aws-lambda');
import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //TODO: Add Dynamo config

    // const lambda_api = new lambda.Function(this, 'Lambda', {
    //   runtime: lambda.Runtime.Go1x,
    //   code: lambda.Code.asset('resources'),
    //   handler: 'main'               
    // });

    //Queue for Lambda Starter
    const queue = new sqs.Queue(this, 'CdkQueue', {
      visibilityTimeoutSec: 300
    });

    //Lambda to kick off batch to SQS  
    const lambda_starter = new lambda.Function(this, 'Lambda', {
      runtime: lambda.Runtime.DotNetCore21,
      code: lambda.Code.asset('../Functions/deploy/lamb-net.zip'),
      handler: 'lamb-net::StarterFunc.Functions::Get'               
    });


    const lambda_worker = new lambda.Function(this, 'Lambda', {
      runtime: lambda.Runtime.DotNetCore21,
      code: lambda.Code.asset('../Functions/deploy/WorkerFunc.zip'),
      handler: 'WorkerFunc::WorkerFunc.Functions::Get'               
    });

    lambda_worker.addEventSource(new SqsEventSource(queue));

  }
}
