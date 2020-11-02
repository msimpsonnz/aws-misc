import * as cdk from '@aws-cdk/core';
import * as sqs from '@aws-cdk/aws-sqs';
import * as lambda from '@aws-cdk/aws-lambda';
import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';


export class SqsFifoSingleStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const queue = new sqs.Queue(this, 'queue', {
      fifo: true
    });

    const fn = new lambda.Function(this, 'fnEventLogger', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(20),
      code: lambda.Code.fromInline(`
        exports.handler = async function(event) { 
          console.log(JSON.stringify(event));
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      `),
      reservedConcurrentExecutions: 1
    });

    fn.addEventSource(
      new SqsEventSource(queue, {
        batchSize: 1,
      })
    );

    new cdk.CfnOutput(this, 'queueUrl', {
      value: queue.queueUrl
    })

  }
}
