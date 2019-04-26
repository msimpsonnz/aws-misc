import cdk = require('@aws-cdk/cdk');
import { StackProps } from '@aws-cdk/cdk'
//import dynamo = require('@aws-cdk/aws-dynamodb');
import lambda = require('@aws-cdk/aws-lambda');
import { CfnParametersCode } from '@aws-cdk/aws-lambda';
//import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';

export interface LambdaProps extends StackProps {
  /** the function for which we want to count url hits **/
  lambdaCode: CfnParametersCode;
}

// export class LambdaStarterStack extends cdk.Stack {
//   constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
//     super(scope, id, props);
export class LambdaStarterStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: LambdaProps) {
    super(scope, id, props);

    //const lambdaCode = lambda.Code.cfnParameters();
    //Lambda to kick off batch to SQS  
    new lambda.Function(this, 'LambdaStarter', {
      runtime: lambda.Runtime.DotNetCore21,
      code: props.lambdaCode,
      handler: 'lamb-net::StarterFunc.Functions::Get'               
    });
  }
}

// export class LambdaWorkerStack extends cdk.Stack {
//   constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
//     super(scope, id, props);

//     const lambdaCode = lambda.Code.cfnParameters();
//     new lambda.Function(this, 'LambdaWorker', {
//       runtime: lambda.Runtime.DotNetCore21,
//       code: lambdaCode,
//       handler: 'WorkerFunc::WorkerFunc.Functions::Get'               
//     });

//     //lambda_worker.addEventSource(new SqsEventSource(props.));
  
//   }
// }