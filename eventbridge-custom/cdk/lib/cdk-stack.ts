import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import s3 = require('@aws-cdk/aws-s3');
import firehose = require('@aws-cdk/aws-kinesisfirehose');
import { ServicePrincipal, PolicyStatement } from '@aws-cdk/aws-iam';


export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //Create S3 bucket for the event store
    const bucket = new s3.Bucket(this, "demo-evtbridge-custom");

    //Create a IAM role for Firehose to use to put events
    const s3Role = new iam.Role(this, "demo-evtbridge-s3-role", {
      assumedBy: new ServicePrincipal('firehose.amazonaws.com')
    });

    //Give the IAM Role write access to bucket
    bucket.grantReadWrite(s3Role);

    //Create an IAM role for Event Bridge to use to connect to Firehose
    const evtRole = new iam.Role(this, "demo-evtbridge-firehose-role", {
      assumedBy: new ServicePrincipal('events.amazonaws.com'),
      roleName: 'demo-evtbridge-firehose-role'
    });

    //Give the IAM role access to Firehose
    evtRole.addToPolicy(new PolicyStatement({
      resources: ['*'],
      actions: ['firehose:PutRecord','firehose:PutRecordBatch'] }));

    //Create the Firehose with connection to S3, assign role and config
    const deliveryStream = new firehose.CfnDeliveryStream(this, "stream-evtbridge-custom", {
      deliveryStreamName: 'stream-evtbridge-custom',
      deliveryStreamType: 'DirectPut',
      s3DestinationConfiguration: {
        bucketArn: bucket.bucketArn,
        bufferingHints: {
          intervalInSeconds: 300,
          sizeInMBs: 5
        },
        compressionFormat: 'UNCOMPRESSED',
        roleArn: s3Role.roleArn
      }

    });

  }
}
