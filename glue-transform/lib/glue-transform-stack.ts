import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as glue from '@aws-cdk/aws-glue';


export class GlueTransformStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = s3.Bucket.fromBucketName(this, 'bucket', 'kinesisfilterstack-analyticsoutputbucketd2048569-uugrrs6nmga0')
    
    const roleGlueJob = new iam.Role(this, 'roleGlueJob', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
    });
    roleGlueJob.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'))

    roleGlueJob.addToPolicy(
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

    //cosnt crawler = new glue.CfnCrawler(this, 'crawler', )
    const job = new glue.CfnJob(this, 'job', {
      role: roleGlueJob.roleArn,
      command: {
        name: 'glueetl',
        scriptLocation: `s3://${bucket.bucketName}/scripts/glue.py`,
        pythonVersion: '3'
      },
      defaultArguments: {
        s3_bucket: bucket.bucketName
      },
      glueVersion: '2.0'
    })

  }
}
