import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as lambda from '@aws-cdk/aws-lambda';
import * as lambdanode from '@aws-cdk/aws-lambda-nodejs';
import * as kinesis from '@aws-cdk/aws-kinesis';
import * as kinesisfirehose from '@aws-cdk/aws-kinesisfirehose';
import * as kinesisanalytics from '@aws-cdk/aws-kinesisanalytics';
//import { Rule, Schedule } from '@aws-cdk/aws-events';

export class KinesisFilterStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const streamInput = new kinesis.Stream(this, 'streamInput', {
      streamName: 'streamInput',
      shardCount: 1,
    });

    const streamOutput = new s3.Bucket(this, 'analyticsOutputBucket');

    const fn = new lambdanode.NodejsFunction(this, 'fn', {
      runtime: lambda.Runtime.NODEJS_12_X,
      entry: './func/getData/index.ts',
      handler: 'handler',
      environment: {
        AWS_KINSESIS_STREAM: streamInput.streamName,
      },
    });
    streamInput.grantWrite(fn);

    // // new Rule(this, 'ScheduleRule', {
    // //   schedule: Schedule.cron({ day: '1' }),
    // //   targets: [fn],
    // //  });

    const roleKinesisAnalytics = new iam.Role(this, 'roleKinesisAnalytics', {
      assumedBy: new iam.ServicePrincipal('kinesisanalytics.amazonaws.com'),
    });

    roleKinesisAnalytics.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [streamInput.streamArn],
        actions: [
          'kinesis:DescribeStream',
          'kinesis:GetShardIterator',
          'kinesis:GetRecords',
          'kinesis:ListShards',
        ],
      })
    );

    const sql = `
      CREATE OR REPLACE STREAM "DESTINATION_USER_DATA" (
        first VARCHAR(16),
        last VARCHAR(16),
        age INTEGER,
        gender VARCHAR(16),
        latitude FLOAT,
        longitude FLOAT
      );
      CREATE OR REPLACE PUMP "STREAM_PUMP" AS INSERT INTO "DESTINATION_USER_DATA"

      SELECT STREAM "first", "last", "age", "gender", "latitude", "longitude"
      FROM "SOURCE_SQL_STREAM_001"
      WHERE "age" >= 21;
    `;



    const kinesisApp = new kinesisanalytics.CfnApplicationV2(this, 'kinesisApp', {
      runtimeEnvironment: 'SQL-1_0',
      serviceExecutionRole: roleKinesisAnalytics.roleArn,
      applicationConfiguration: {
        sqlApplicationConfiguration: {
          inputs: [
            {
              namePrefix: 'SOURCE_SQL_STREAM',
              inputSchema: {
                recordColumns: [
                  {
                    name: 'first',
                    mapping: '$.name.first',
                    sqlType: 'VARCHAR(16)',
                  },
                ],
                recordFormat: {
                  recordFormatType: 'JSON',
                  mappingParameters: {
                    jsonMappingParameters: {
                      recordRowPath: '$'
                    }
                  }
                }
              },
              kinesisStreamsInput: {
                resourceArn: streamInput.streamArn,
              },
            },
          ],
        },
        applicationCodeConfiguration: {
          codeContent: {
            textContent: sql
          },
          codeContentType: 'PLAINTEXT'
        }
      },
    });

    const roleKinesisFirehose = new iam.Role(this, 'roleKinesisFirehose', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
    });

    roleKinesisFirehose.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [streamOutput.bucketArn, `${streamOutput.bucketArn}/*`],
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

    const firehose = new kinesisfirehose.CfnDeliveryStream(this, 'firehose', {
      deliveryStreamType: 'DirectPut',
      s3DestinationConfiguration: {
        bucketArn: streamOutput.bucketArn,
        roleArn: roleKinesisFirehose.roleArn,
      },
    });

    const kinesisAnalyticsOutput = new kinesisanalytics.CfnApplicationOutputV2(this, 'kinesisAnalyticsOutput', {
      applicationName: kinesisApp.ref,
      output: {
        destinationSchema: {
          recordFormatType: 'JSON'
        },
        kinesisFirehoseOutput: {
          resourceArn: firehose.attrArn
        },
        name: 'DESTINATION_USER_DATA'
      }
      
    })

    roleKinesisAnalytics.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [firehose.attrArn],
        actions: [
          'firehose:DescribeDeliveryStream',
          'firehose:PutRecord',
          'firehose:PutRecordBatch',
        ],
      })
    );
  }
}
