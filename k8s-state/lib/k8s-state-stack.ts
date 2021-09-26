import { 
  Duration,
  Stack, 
  StackProps,
  aws_iam as iam,
  aws_dynamodb as dynamodb,
  aws_lambda as lambda,
  aws_lambda_nodejs as lambda_nodejs,
  aws_lambda_event_sources as lambda_event_sources,
  aws_sqs as sqs,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class K8SStateStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'table', {
      partitionKey: {
        name: 'pk',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_IMAGE 
    });

    const fn_postExternal = new lambda_nodejs.NodejsFunction(this, 'fn_postExternal', {
      entry: './functions/postExternal/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      timeout: Duration.seconds(10),
      environment: {
      }
    });

    fn_postExternal.addEventSource(new lambda_event_sources.DynamoEventSource(table, {
      startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 5
    }));

    const queue = new sqs.Queue(this, 'queue');

    const fn_sqsHandler = new lambda_nodejs.NodejsFunction(this, 'fn_sqsHandler', {
      entry: './functions/postExternal/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      timeout: Duration.seconds(10),
      environment: {
      }
    });

    fn_sqsHandler.addEventSource(new lambda_event_sources.SqsEventSource(queue, {
    }));

  }
}
