import * as cdk from '@aws-cdk/core';

export class FargateScaleStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);



    const fargateTaskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: 512,
      cpu: 256
    });

    const container = fargateTaskDefinition.addContainer("WebContainer", {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
    });

    const service = new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition,
      desiredCount: 1
    });
  }
}
