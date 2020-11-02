import * as cdk from '@aws-cdk/core';
import * as sqs from '@aws-cdk/aws-sqs';
import * as lambda from '@aws-cdk/aws-lambda';
import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';


export class SqsFifoSingleStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const queueFifo = new sqs.Queue(this, 'queueFifo', {
      fifo: true
    });

    const fnFifo = new lambda.Function(this, 'fnFifo', {
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

    fnFifo.addEventSource(
      new SqsEventSource(queueFifo, {
        batchSize: 1,
      })
    );

    new cdk.CfnOutput(this, 'queueFifoUrl', {
      value: queueFifo.queueUrl
    })


    const queueStd = new sqs.Queue(this, 'queueStd')
    const queueStdDL = new sqs.Queue(this, 'queueStdDL')

    const fnStd = new lambda.Function(this, 'fnStd', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(20),
      code: lambda.Code.fromInline(`
        exports.handler = async function(event) { 
          console.log(JSON.stringify(event));
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      `),
      reservedConcurrentExecutions: 1,
      deadLetterQueue: queueStdDL,
      deadLetterQueueEnabled: true
    });

    fnStd.addEventSource(
      new SqsEventSource(queueStd, {
        batchSize: 1,
      })
    );

    new cdk.CfnOutput(this, 'queueStdUrl', {
      value: queueStd.queueUrl
    })

  }
}
