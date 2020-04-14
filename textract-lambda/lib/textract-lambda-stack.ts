import * as cdk from "@aws-cdk/core";
import { Bucket } from "@aws-cdk/aws-s3";
import { Topic } from "@aws-cdk/aws-sns";
import {
  Role,
  ServicePrincipal,
  PolicyStatement,
  Effect,
} from "@aws-cdk/aws-iam";
import { Queue } from '@aws-cdk/aws-sqs';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { Runtime } from '@aws-cdk/aws-lambda';
import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';

export class TextractLambdaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = Bucket.fromBucketName(this, "textract-bucket", "mjs-syd");

    //**********SNS Topics******************************
    const jobCompletionTopic = new Topic(this, "JobCompletion");

    //**********IAM Roles******************************
    const textractServiceRole = new Role(this, "TextractServiceRole", {
      assumedBy: new ServicePrincipal("textract.amazonaws.com"),
    });
    textractServiceRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [jobCompletionTopic.topicArn],
        actions: ["sns:Publish"],
      })
    );

    const dlq = new Queue(this, 'DLQ', {
      visibilityTimeout: cdk.Duration.seconds(30), retentionPeriod: cdk.Duration.seconds(1209600)
    });

    const asyncJobsQueue = new Queue(this, 'AsyncJobs', {
      visibilityTimeout: cdk.Duration.seconds(30), retentionPeriod: cdk.Duration.seconds(1209600), deadLetterQueue : { queue: dlq, maxReceiveCount: 50}
    });

    const asyncProcessor = new NodejsFunction(this, 'asyncProcessor', {
      entry: './func/processFunction/index.ts',
      handler: 'handler',
      runtime: Runtime.NODEJS_12_X,
      environment: {
        TEXTRACT_PUBLISH_TO_SNS_IAM_ROLE_ARN: textractServiceRole.roleArn,
        TEXTRACT_PUBLISH_SNS_TOPIC_ARN: jobCompletionTopic.topicArn
      }
    });

    asyncProcessor.addToRolePolicy(
      new PolicyStatement({
        actions: ["iam:PassRole"],
        resources: [textractServiceRole.roleArn]
      })
    );
    asyncProcessor.addToRolePolicy(
      new PolicyStatement({
        actions: ["textract:*"],
        resources: ["*"]
      })
    );

    asyncProcessor.addEventSource(new SqsEventSource(asyncJobsQueue));

  }
}
