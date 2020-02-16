import * as cdk from '@aws-cdk/core';
import ec2 from '@aws-cdk/aws-ec2';
import lambda from '@aws-cdk/aws-lambda'

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = (config.defaultVpc === true) ? ec2.Vpc.fromLookup(this, 'vpc-default', {
      isDefault: true
    }) :
      new ec2.Vpc(this, 'ss-vpc', {
        cidr: '10.0.0.0/16',
        maxAzs: 2,
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'publicSubnet',
            subnetType: ec2.SubnetType.PUBLIC,
          }
        ],
        natGateways: 0
      });

  }
}
