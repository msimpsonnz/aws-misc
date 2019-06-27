import cdk = require('@aws-cdk/core');
import ec2 = require("@aws-cdk/aws-ec2");
import ecr = require("@aws-cdk/aws-ecr");
import ecs = require("@aws-cdk/aws-ecs");
import ecs_patterns = require("@aws-cdk/aws-ecs-patterns");


export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "MyVpc", {
      maxAZs: 3 // Default is all AZs in region
    });

    const cluster = new ecs.Cluster(this, "MyCluster", {
      vpc: vpc
    });
    
    const ecrRepo = new ecr.Repository(this, "mjs-iam-demo");
    

    // Create a load-balanced Fargate service and make it public
    var fargateSvc = new ecs_patterns.LoadBalancedFargateService(this, "MyFargateService", {
      cluster: cluster, // Required
      cpu: 512, // Default is 256
      desiredCount: 6, // Default is 1
      image: ecs.ContainerImage.fromRegistry(ecrRepo.repositoryUri + ':latest'), // Required
      memoryLimitMiB: 2048, // Default is 512
      publicLoadBalancer: true // Default is false
      
    });

    //ecrRepo.grantPull(fargateSvc.service.taskDefinition.executionRole);

    fargateSvc.service.taskDefinition.taskRole.addManagedPolicy({
      managedPolicyArn: "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
    });
  }
}
