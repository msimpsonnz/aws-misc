import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_cognito as cognito,
  aws_lambda as lambda
} from 'aws-cdk-lib';

export class CognitoMigrateStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);


    // const authChallengeFn = new lambda.Function(this, 'authChallengeFn', {
    //   runtime: lambda.Runtime.NODEJS_12_X,
    //   handler: 'index.handler',
    //   code: lambda.Code.fromAsset(path.join(__dirname, 'path/to/asset')),
    // });

    const userpool = new cognito.UserPool(this, 'userpool');

    userpool.addTrigger(cognito.UserPoolOperation.USER_MIGRATION,
        new lambda.Function(this, 'userMigrationFn', {
        runtime: lambda.Runtime.NODEJS_14_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
          exports.handler = async function(event) { 
            console.log(JSON.stringify(event));
          }
        `),
      })
    );

  }
}
