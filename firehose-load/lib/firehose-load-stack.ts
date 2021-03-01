import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as firehose from '@aws-cdk/aws-kinesisfirehose';
import * as lambdaNode from '@aws-cdk/aws-lambda-nodejs'

export class FirehoseLoadStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'bucket')

    const fnStreamProcessor = new lambdaNode.NodejsFunction(this, 'firehoseLoad', {
      entry: './functions/firehoseLoad/index.js',
      memorySize: 256,
      timeout: cdk.Duration.seconds(10)
    })

    const roleKinesisFirehose = new iam.Role(this, 'roleKinesisFirehose', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
    });


    roleKinesisFirehose.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
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
        resources: [ fnStreamProcessor.functionArn ],
        actions: [
          'lambda:GetFunctionConfiguration',
          'lambda:InvokeFunction'
        ],
      })
    );

    const firehoseStream = new firehose.CfnDeliveryStream(this, 'firehose', {
      deliveryStreamType: 'DirectPut',
      extendedS3DestinationConfiguration: {
        bucketArn: bucket.bucketArn,
        roleArn: roleKinesisFirehose.roleArn,
        compressionFormat: 'UNCOMPRESSED',
        bufferingHints: {
          sizeInMBs: 50,
          intervalInSeconds: 300
        },
        processingConfiguration: {
          enabled: true,
          processors: [
            {
              type: 'Lambda',
              parameters: [
                {
                  parameterName: 'LambdaArn',
                  parameterValue: fnStreamProcessor.functionArn
                },
                {
                  parameterName: 'BufferSizeInMBs',
                  parameterValue: '3'
                },
                {
                  parameterName: 'BufferIntervalInSeconds',
                  parameterValue: '60'
                },
              ]
            }
          ]
        }
      },
    });


  }
}
