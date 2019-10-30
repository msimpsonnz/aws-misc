import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import targets = require('@aws-cdk/aws-elasticloadbalancingv2-targets');
import lambda = require('@aws-cdk/aws-lambda');
import { CfnOutput } from '@aws-cdk/core';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'default', {
      isDefault: true
      }
    );

    const lb = new elbv2.ApplicationLoadBalancer(this, 'alb', {
      vpc: vpc,
      internetFacing: true
    });

    const lambdaFnNative = new lambda.Function(this, 'custom-lambda-native', {
      runtime: lambda.Runtime.PROVIDED,
      code: new lambda.AssetCode("../Net30.Native/bin/Release/netcoreapp3.0/Net30.Native.zip"),
      handler: 'not_required_for_custom_runtime',
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      environment: {
        "FakeIterations": "1000"
      }
    });

    const lambdaFnNewton = new lambda.Function(this, 'custom-lambda-newton', {
      runtime: lambda.Runtime.PROVIDED,
      code: new lambda.AssetCode("../Net30.Newton/bin/Release/netcoreapp3.0/Net30.Newton.zip"),
      handler: 'not_required_for_custom_runtime',
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      environment: {
        "FakeIterations": "1000"
      }
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'lambdatarget', { vpc, port: 80 });
    const listener = lb.addListener('Listener', { 
      port: 80,
      defaultTargetGroups: [targetGroup]
    });
  
    listener.addTargets('NativeTarget', {
        targets: [new targets.LambdaTarget(lambdaFnNative)],
        pathPattern: "/lambda/native",
        priority: 1
    });

    listener.addTargets('NewtonTarget', {
      targets: [new targets.LambdaTarget(lambdaFnNewton)],
      pathPattern: "/lambda/newton",
      priority: 2
    });

    new CfnOutput(this, 'albDns', {
      value: lb.loadBalancerDnsName,
      description: 'DNS of the ALB'
    });

  }
}
