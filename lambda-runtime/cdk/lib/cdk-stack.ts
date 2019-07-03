import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import autoscaling = require('@aws-cdk/aws-autoscaling');
import lambda = require('@aws-cdk/aws-lambda');

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'lamdba-custom-vpc');

    const lb = new elbv2.ApplicationLoadBalancer(this, 'alb', {
      vpc,
      internetFacing: true
    });

    const listener = lb.addListener('Listener', {
      port: 80,
      open: true,
    });

    const lambdaFnShim = new lambda.Function(this, 'custom-lambda-shim', {
      runtime: lambda.Runtime.PROVIDED,
      code: new lambda.AssetCode("../CustomRuntimeFunction/src/CustomRuntimeFunction/bin/Release/netcoreapp3.0/CustomRuntimeFunction.zip"),
      handler: 'not_required_for_custom_runtime',
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      environment: {
        
      }
    });

    const lambdaFnNewton = new lambda.Function(this, 'custom-lambda-newton', {
      runtime: lambda.Runtime.PROVIDED,
      code: new lambda.AssetCode("../CustomRuntimeFunction/src/CustomRuntimeFunction/bin/Release/netcoreapp3.0/CustomRuntimeFunction.zip"),
      handler: 'not_required_for_custom_runtime',
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      environment: {
        
      }
    });

    //TODO once CDK supports Lambda with ALB https://github.com/awslabs/aws-cdk/issues/1921
    // listener.addTargets('lambdaTargets', {
    //   port: 80,
    //   targets: [lambdaFnShim],
    //   pathPattern: '/shim/*'
    // });

  }
}
