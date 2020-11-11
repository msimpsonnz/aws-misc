import * as cdk from '@aws-cdk/core';
import * as kinesis from '@aws-cdk/aws-kinesis';
import * as s3 from '@aws-cdk/aws-s3';
import * as lambda from '@aws-cdk/aws-lambda';
import * as event from '@aws-cdk/aws-lambda-event-sources';
import * as iam from '@aws-cdk/aws-iam';
import * as kinesisfirehose from '@aws-cdk/aws-kinesisfirehose';

export class KinesisDemoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const streamInput = new kinesis.Stream(this, 'streamInput', {
      streamName: 'streamInput',
      shardCount: 1,
    });

    const bucketOutput = new s3.Bucket(this, 'firehoseOutputBucket');

    const fnEventLogger = new lambda.Function(this, 'fnEventLogger', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async function(event) {
          console.log(JSON.stringify(event));
        }
      `),
    });

    fnEventLogger.addEventSource(
      new event.KinesisEventSource(streamInput, {
        batchSize: 100, // default
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
      })
    );

    const roleKinesisFirehose = new iam.Role(this, 'roleKinesisFirehose', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
    });


    roleKinesisFirehose.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [bucketOutput.bucketArn, `${bucketOutput.bucketArn}/*`],
        actions: [
          's3:AbortMultipartUpload',
          's3:GetBucketLocation',
          's3:GetObject',
          's3:ListBucket',
          's3:ListBucketMultipartUploads',
          's3:PutObject',
        ],
      })
    );

    roleKinesisFirehose.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        //resources: [streamOutput.streamArn],
        resources: ['*'],
        actions: [
          // 'kinesis:DescribeStream'
          'kinesis:*'
        ],
      })
    );

    const firehose = new kinesisfirehose.CfnDeliveryStream(this, 'firehose', {
      deliveryStreamType: 'KinesisStreamAsSource',
      kinesisStreamSourceConfiguration: {
        kinesisStreamArn: streamInput.streamArn,
        roleArn: roleKinesisFirehose.roleArn
      },
      s3DestinationConfiguration: {
        bucketArn: bucketOutput.bucketArn,
        roleArn: roleKinesisFirehose.roleArn,
      },
    });

  }
}
