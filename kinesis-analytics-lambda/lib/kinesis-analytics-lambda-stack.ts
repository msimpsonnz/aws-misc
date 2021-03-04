import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as kinesisfirehose from '@aws-cdk/aws-kinesisfirehose';
import * as kinesisanalytics from '@aws-cdk/aws-kinesisanalytics';

export class KinesisAnalyticsLambdaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'bucket');

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

    const firehose = new kinesisfirehose.CfnDeliveryStream(this, 'firehose', {
      deliveryStreamType: 'KinesisStreamAsSource',
      s3DestinationConfiguration: {
        bucketArn: bucketOutput.bucketArn,
        roleArn: roleKinesisFirehose.roleArn,
      },
    });

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
      latitude VARCHAR(16),
      longitude VARCHAR(16)
    );
    CREATE OR REPLACE PUMP "STREAM_PUMP" AS INSERT INTO "DESTINATION_USER_DATA"

    SELECT STREAM "first", "last", "age", "gender", "latitude", "longitude"
    FROM "SOURCE_SQL_STREAM_001"
    WHERE "age" >= 21;
  `;

    const kinesisAppV1 = new kinesisanalytics.CfnApplication(
      this,
      'kinesisAppV1',
      {
        applicationCode: sql,
        inputs: [
          {
            namePrefix: 'SOURCE_SQL_STREAM',
            inputSchema: {
              recordColumns: [
                {
                  name: 'first',
                  mapping: '$.first',
                  sqlType: 'VARCHAR(16)',
                },
                {
                  name: 'last',
                  mapping: '$.last',
                  sqlType: 'VARCHAR(16)',
                },
                {
                  name: 'age',
                  mapping: '$.age',
                  sqlType: 'INTEGER',
                },
                {
                  name: 'gender',
                  mapping: '$.gender',
                  sqlType: 'VARCHAR(16)',
                },
                {
                  name: 'latitude',
                  mapping: '$.latitude',
                  sqlType: 'VARCHAR(16)',
                },
                {
                  name: 'longitude',
                  mapping: '$.longitude',
                  sqlType: 'VARCHAR(16)',
                },
              ],
              recordFormat: {
                recordFormatType: 'JSON',
                mappingParameters: {
                  jsonMappingParameters: {
                    recordRowPath: '$',
                  },
                },
              },
            },
            kinesisStreamsInput: {
              resourceArn: streamInput.streamArn,
              roleArn: roleKinesisAnalytics.roleArn,
            },
          },
        ],
      }
    );
  }
}
