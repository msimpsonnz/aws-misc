import * as cdk from '@aws-cdk/core';
import { Queue } from '@aws-cdk/aws-sqs';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs'
import { Runtime } from '@aws-cdk/aws-lambda'

export class SagePredictInfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const queue = new Queue(this, 'queue');

    new cdk.CfnOutput(this, 'output-queue', {
      value: queue.queueUrl
    });

    const fn_Predict = new NodejsFunction(this, 'fn_Predict', {
      entry: '../functions/WrapLambda/index.ts',
      handler: 'index.handler',
      //runtime: Runtime.NODEJS_12_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment:
      {
        AWS_SAGEMAKER_ENDPOINT: "xgboost-2020-07-07-07-32-11-117"
      }
    })



    // const fn_publishStatus = new lambda.Function(this, 'fn_publishStatus', {
    //   code: lambda.Code.fromAsset('../greengrass/', {
    //     bundling: {
    //       image: lambda.Runtime.PYTHON_3_7.bundlingDockerImage,
    //       command: [
    //         'bash',
    //         '-c',
    //         `
    //         rsync -r . /asset-output
    //         `,
    //       ],
    //     },
    //   }),
    //   runtime: lambda.Runtime.PYTHON_3_7,
    //   handler: 'publishStatus.function_handler',
    // });
  }
}
