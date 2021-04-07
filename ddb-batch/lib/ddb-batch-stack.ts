import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as sqs from '@aws-cdk/aws-sqs';
import * as lambda from '@aws-cdk/aws-lambda';
import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';

export class DdbBatchStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'table', {
      partitionKey: {
        name: 'pk',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'sk',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const queue = new sqs.Queue(this, 'queue');

    const fnProducer = new lambda.Function(this, 'fnProducer', {
      code: lambda.AssetCode.fromAsset('./functions/producer/src/producer/bin/Release/netcoreapp3.1/producer.zip'),
      handler: "producer::producer.Function::FunctionHandler",
      runtime: lambda.Runtime.DOTNET_CORE_3_1,
      memorySize: 256,
      timeout: cdk.Duration.seconds(60),
      environment: {
        'AWS_SQS_Q_URL': queue.queueUrl
      }
    });
    queue.grantSendMessages(fnProducer);

    const fnWriteCondition = new lambda.Function(this, 'fnWriteCondition', {
      code: lambda.AssetCode.fromAsset('./functions/writer/src/writer/bin/Release/netcoreapp3.1/writer.zip'),
      handler: "writer::writer.Function::FunctionHandler",
      runtime: lambda.Runtime.DOTNET_CORE_3_1,
      memorySize: 256,
      timeout: cdk.Duration.seconds(15),
      environment: {
        'AWS_DYNAMODB_TABLE': table.tableName,
        'MODE': 'COND'
      }
    });
    table.grantReadWriteData(fnWriteCondition);
    fnWriteCondition.addEventSource(new SqsEventSource(queue));

    const fnWriteBatch = new lambda.Function(this, 'fnWriteBatch', {
      code: lambda.AssetCode.fromAsset('./functions/writer/src/writer/bin/Release/netcoreapp3.1/writer.zip'),
      handler: "writer::writer.Function::FunctionHandler",
      runtime: lambda.Runtime.DOTNET_CORE_3_1,
      memorySize: 256,
      timeout: cdk.Duration.seconds(15),
      environment: {
        'AWS_DYNAMODB_TABLE': table.tableName,
        'MODE': 'BATCH'
      }
    });
    table.grantReadWriteData(fnWriteBatch);
    fnWriteBatch.addEventSource(new SqsEventSource(queue, {
      maxBatchingWindow: cdk.Duration.seconds(5),
      batchSize: 25
    }));

  }
}
