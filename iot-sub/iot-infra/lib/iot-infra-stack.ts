import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';

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
            cp -au . /asset-output
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
            cp -au . /asset-output
            `,
          ],
        },
      }),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'publishStatus.function_handler',
    });
    fn_publishStatus.currentVersion.addAlias('live');

  }
}
