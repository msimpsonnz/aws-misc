import * as cdk from "@aws-cdk/core";
import { Vpc, SubnetType } from "@aws-cdk/aws-ec2";
import * as lambda from "@aws-cdk/aws-lambda";

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const config = {
      defaultVpc: false
    };

    const stackVpc =
      config.defaultVpc === true
        ? Vpc.fromLookup(this, "vpc-default", {
            isDefault: true
          })
        : new Vpc(this, "cwl-vpc", {
            cidr: "10.0.0.0/16",
            maxAzs: 2,
            subnetConfiguration: [
              {
                cidrMask: 24,
                name: "isolatedSubnet",
                subnetType: SubnetType.ISOLATED
              }
            ],
            natGateways: 0
          });

    new lambda.Function(this, "cwl-embedded-lambda", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: new lambda.AssetCode('../func'),
      handler: 'handler',
      vpc: stackVpc
    });

  }
}
