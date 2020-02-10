import * as cdk from '@aws-cdk/core';
import { Role, ServicePrincipal, PolicyStatement } from '@aws-cdk/aws-iam';
import { CfnQueue } from '@aws-cdk/aws-mediaconvert';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const role = new Role(this, 'mjs-media-convert-role', {
      assumedBy: new ServicePrincipal('mediaconvert.amazonaws.com')
    });

    role.addToPolicy(new PolicyStatement({
      resources: ['*'],
      actions: ['s3:*'] }));

    new cdk.CfnOutput(this, 'mjs-media-convert-role-output', {
        value: role.roleArn
    });

    const queue = new CfnQueue(this, 'mjs-media-convet');

    new cdk.CfnOutput(this, 'mjs-media-convert-queue-output', {
      value: queue.attrArn
    });



  }
}
