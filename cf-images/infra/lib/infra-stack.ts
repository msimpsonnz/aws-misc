import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';

export class InfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'vpc-default', {
      isDefault: true,
    });

    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
    });

    const repository = ecr.Repository.fromRepositoryName(this, 'demo-repo', 'nginx_demo');

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'TaskDef',
      {
        memoryLimitMiB: 512,
        cpu: 256,
      }
    );

    const container = taskDefinition.addContainer('WebContainer', {
      image: ecs.ContainerImage.fromEcrRepository(repository),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: `ecs-demo-nginx`,
      }),
    });

    container.addPortMappings({
      containerPort: 80
    })

    const service = new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition,
      desiredCount: 1,
      assignPublicIp: true,
      vpcSubnets: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PUBLIC
      })
    });

    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true,
    });
    const listener = lb.addListener('Listener', { port: 80 });
    const targetGroup = listener.addTargets('ECS1', {
      port: 80,
      targets: [service],
      deregistrationDelay: cdk.Duration.seconds(5),
      healthCheck: {
        path: '/index.html',
        interval: cdk.Duration.seconds(60),
      }
    });
  }
}
