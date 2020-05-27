import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as eventsource from '@aws-cdk/aws-lambda-event-sources';
import * as path from 'path';
import {Queue} from '@aws-cdk/aws-sqs'

export class LambdaEmfStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const queue = new Queue(this, 'emfDemoQueue', {
      visibilityTimeout: cdk.Duration.seconds(10)    
    })

    const fn = new lambda.Function(this, 'emfDemo', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../func/lambda_emf')),
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        AWS_SQS_QUEUE_URL: queue.queueUrl
      }
    });

    fn.addEventSource(new eventsource.SqsEventSource(queue)) 

  }
}
