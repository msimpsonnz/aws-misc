import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda-nodejs";

export class CdkNewStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new lambda.NodejsFunction(this, "cwl-embedded-lambda", {
      entry: '../func/handler.ts',
      handler: 'handler',
      //vpc: stackVpc
    });

    
    new lambda.NodejsFunction(this, "cwl-embedded-lambda");

  }
}
