import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as origins from '@aws-cdk/aws-cloudfront-origins';
import * as lambda from '@aws-cdk/aws-lambda';
import * as lambdanode from '@aws-cdk/aws-lambda-nodejs';
import { BucketPolicy } from '@aws-cdk/aws-s3';

export class CfSignedStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Bucket for Hosting
    const bucket = new s3.Bucket(this, 'demo-web-bucket', {
      bucketName: 'mjs-demo-cf-signed-url',
    });

    const roleLambda = new iam.Role(this, 'roleLambda', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('lambda.amazonaws.com'),
        new iam.ServicePrincipal('edgelambda.amazonaws.com')
      ),
    });

    roleLambda.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole'
      )
    );

    const fnSigner = new lambda.Function(this, 'fnSigner', {
      role: roleLambda,
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('./func/signer'),
    });

    const fnViewer = new lambda.Function(this, 'fnViewer', {
      role: roleLambda,
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('./func/dist/viewer-request-function.zip'),
    });

    const fnResize = new lambda.Function(this, 'fnResize', {
      role: roleLambda,
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('./func/dist/origin-response-function.zip'),
      memorySize: 512,
      timeout: cdk.Duration.seconds(10)
    });

    const s3Origin = new origins.S3Origin(bucket);

    const cfDist = new cloudfront.Distribution(this, 'myDist', {
      defaultBehavior: {
        origin: s3Origin,
        forwardQueryString: true,
        edgeLambdas: [
          {
            functionVersion: fnSigner.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
          },
        ],
      },
    });

    cfDist.addBehavior('images/*', s3Origin, {
      edgeLambdas: [
        {
          functionVersion: fnViewer.currentVersion,
          eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
        },
        {
          functionVersion: fnResize.currentVersion,
          eventType: cloudfront.LambdaEdgeEventType.ORIGIN_RESPONSE,
        },
      ],
    });

    const bucketPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject'
      ],
      resources: [
        `arn:aws:s3:::${bucket.bucketName}`,
        `arn:aws:s3:::${bucket.bucketName}/*`
      ],
    })
    bucketPolicy.addArnPrincipal(roleLambda.roleArn)

    bucket.addToResourcePolicy(bucketPolicy);

  }
}
