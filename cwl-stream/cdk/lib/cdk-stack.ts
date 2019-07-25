import cdk = require('@aws-cdk/core');
import lambda = require("@aws-cdk/aws-lambda");
import s3 = require("@aws-cdk/aws-s3");

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "mjscwlstream");

    const handler = new lambda.Function(this, "cwlStreamHandler", {
      runtime: lambda.Runtime.NODEJS_8_10, // So we can use async in widget.js
      code: lambda.Code.asset("resources"),
      handler: "index.handler",
      environment: {
        BUCKET: bucket.bucketName
      }
    });

    bucket.grantReadWrite(handler); 


  }
}
