import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import { Bucket } from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';
import { DockerImageAsset } from '@aws-cdk/aws-ecr-assets';
import * as iam from '@aws-cdk/aws-iam';

export class IotInfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //Setup the functions that will be used on the local Greengrass Core Device

    const fn_localStatus = new lambda.Function(this, 'fn_localStatus', {
      code: lambda.Code.fromAsset('../greengrass/', {
        bundling: {
          image: lambda.Runtime.PYTHON_3_7.bundlingDockerImage,
          command: [
            'bash',
            '-c',
            `
            rsync -r . /asset-output
            `,
          ],
        },
      }),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'localStatus.function_handler',
    });
    fn_localStatus.currentVersion.addAlias('live');

    const fn_publishStatus = new lambda.Function(this, 'fn_publishStatus', {
      code: lambda.Code.fromAsset('../greengrass/', {
        bundling: {
          image: lambda.Runtime.PYTHON_3_7.bundlingDockerImage,
          command: [
            'bash',
            '-c',
            `
            rsync -r . /asset-output
            `,
          ],
        },
      }),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'publishStatus.function_handler',
    });
    fn_publishStatus.currentVersion.addAlias('live');

    //Create a S3 Bucket to store the Docker Compose File
    const bucket = new Bucket(this, 'bucket');

    // // Upload Docker Compose file for Docker Connector to run on Greengrass device
    // new s3deploy.BucketDeployment(this, 'docker-compose', {
    //   sources: [s3deploy.Source.asset('../docker-compose')],
    //   destinationBucket: bucket,
    // });

    // const asset = new DockerImageAsset(this, 'MyBuildImage', {
    //   directory: '../localAPI',
    // });

    const role = new iam.Role(this, 'role', {
      roleName: 'mjs-demo-greengrass-core-role',
      assumedBy: new iam.ServicePrincipal('greengrass.amazonaws.com'),
    });

    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ['*'],
        actions: [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ],
      })
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ['*'],
        actions: ['ecr:GetAuthorizationToken'],
      })
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [`${bucket.bucketArn}/*`],
        actions: ['s3:GetObject'],
      })
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [
          "arn:aws:logs:*:*:*"
        ],
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ],
      })
    );
  }
}
