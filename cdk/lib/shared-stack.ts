// import sqs = require('@aws-cdk/aws-sqs');
// import cdk = require('@aws-cdk/cdk');
// //import dynamo = require('@aws-cdk/aws-dynamodb');

// export class SharedStack extends cdk.Stack {
//     constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
//         super(scope, id, props);

//         //TODO: Add Dynamo config

//         // const lambda_api = new lambda.Function(this, 'Lambda', {
//         //   runtime: lambda.Runtime.Go1x,
//         //   code: lambda.Code.asset('resources'),
//         //   handler: 'main'               
//         // });

//         //Queue for Lambda Starter
//         const queue = new sqs.Queue(this, 'CdkQueue', {
//             visibilityTimeoutSec: 300
//         });
//     }
// }