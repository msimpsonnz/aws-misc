// import * as cdk from '@aws-cdk/core';
// import { Vpc, SubnetType } from '@aws-cdk/aws-ec2';
// import { Repository } from '@aws-cdk/aws-ecr';
// import { ApplicationLoadBalancer } from '@aws-cdk/aws-elasticloadbalancingv2';
// import { Cluster, FargateTaskDefinition, ContainerImage, FargateService } from '@aws-cdk/aws-ecs';


// export class CdkStack extends cdk.Stack {
//   constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
//     super(scope, id, props);

//     const ecrRepo = Repository.fromRepositoryName(this, 'mjs-ecr', 'idsrv');

//     //We need a VPC - this will use the default VPC but can overide to create a new dedicated VPC
//     const vpc = new Vpc(this, 'idsrv-vpc', {
//         cidr: '10.0.0.0/16',
//         maxAzs: 2,
//         subnetConfiguration: [
//           {
//             cidrMask: 24,
//             name: 'publicSubnet',
//             subnetType: SubnetType.PUBLIC,
//           }
//         ],
//         natGateways: 0
//       });

//     //Application load balancer will be the public entry point the the application
//     //Deployed in the VPC from above and configured as internet facing with public IP
//     const appLoadBalancer = new ApplicationLoadBalancer(this, 'idsrv-api-alb', {
//       vpc,
//       internetFacing: true,
//     });
//     //We need a listener for the public side this is then bound to the imported certificate
//     const albListener = appLoadBalancer.addListener('ss-api-alb-listener', {
//       port: 80,
//       open: true
//     });

//     //Create a ECS cluster in the VPC provided
//     const ecsCluster = new Cluster(this, "idsrv-api-ecs", {
//       vpc: vpc
//     });

//     //Create Fargate Task Definition
//     const fargateTaskDefinition = new FargateTaskDefinition(this, 'ss-fargate-task-def', {
//       memoryLimitMiB: 512,
//       cpu: 512
//     });

//     //Create Fargate Task Definition
//     //Use image from ECR, setup logging to CloudWatch with custom prefix, get config.environment  variables from Secret Mgr
//     const fargateTask = fargateTaskDefinition.addContainer('idsrv-container', {
//       image: ContainerImage.fromEcrRepository(ecrRepo, 'idsrv4'),
//       // logging: ecs.LogDrivers.awsLogs({
//       //   streamPrefix: `$idsrv-api-${config.environment}-logs`,
//       // }),
//       environment: {
//       },
//       secrets: {
//       }
//     });

//     //Add a port mapping to the container this exposes the port for the ALB to use
//     fargateTask.addPortMappings({
//       containerPort: 80
//     });

//     //Crearte a Fargate service to run the Task Def
//     //Add to ECS, cluster with task def, no# of replicas
//     //Deployed in VPC and assigned public IP to access ECR without need for NAT
//     const fargateService = new FargateService(this, 'ss-api-fargate-svc', {
//       cluster: ecsCluster,
//       taskDefinition: fargateTaskDefinition,
//       desiredCount: 1,
//       vpcSubnets: vpc.selectSubnets({
//         subnetType: SubnetType.PUBLIC
//       }),
//       assignPublicIp: true
//     });

//     //Add the Fargate service as a target for the ALB
//     //Deregistration delay for draining connections during CD and provide health check
//     const albTarget = albListener.addTargets('idsrv-api-alb-target', {
//       port: 80,
//       //hostHeader: apiFqdn,
//       //pathPattern: '/*',
//       //priority: (config.environment === 'prod') ? 0 : config.environment.length,
//       targets: [fargateService],
//       deregistrationDelay: cdk.Duration.seconds(60),
//       healthCheck: {
//         path: "/",
//         interval: cdk.Duration.seconds(30),
//       }
//     });

//   }
// }
