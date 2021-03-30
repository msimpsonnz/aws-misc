import * as cdk from '@aws-cdk/core';
import * as iam  from '@aws-cdk/aws-iam';
import * as ec2  from '@aws-cdk/aws-ec2';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as dax from '@aws-cdk/aws-dax';

export class DdbDaxStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'vpc', {
      maxAzs: 2
    });

    const table = new dynamodb.Table(this, 'table', {
      partitionKey: {
        name: 'pk',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const daxRole = new iam.Role(this, 'daxRole', {
      assumedBy: new iam.ServicePrincipal('dax.amazonaws.com'),
    });

    daxRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['dynamodb:*'],
      resources: [table.tableArn],
    }));

    const daxCluster = new dax.CfnCluster(this, 'dax', {
      clusterName: 'democluster',
      iamRoleArn: daxRole.roleArn,
      nodeType: 'dax.t2.small',
      replicationFactor: 2
    });

  }
}
