import cdk = require('@aws-cdk/core');
import ec2 = require("@aws-cdk/aws-ec2");
import ecs = require("@aws-cdk/aws-ecs");
import ecr = require('@aws-cdk/aws-ecr');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import { Duration } from '@aws-cdk/core';
import secretmgr = require('@aws-cdk/aws-secretsmanager');
import acm = require('@aws-cdk/aws-certificatemanager');
import route53 = require('@aws-cdk/aws-route53');
import { LoadBalancerTarget } from '@aws-cdk/aws-route53-targets';



export class SsApiFargateStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const environment = this.node.tryGetContext("environment");
    const secretUid = this.node.tryGetContext("secretUid");
    const imageName = this.node.tryGetContext("imageName");
    const defaultVpc = this.node.tryGetContext("defaultVpc");
    const domain = this.node.tryGetContext("domain");
    const certId = this.node.tryGetContext("certId");

    const certArn = `arn:aws:acm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:certificate/${certId}`;
    const ecrRepo = ecr.Repository.fromRepositoryName(this, 'demo-ecr-api', imageName);

    const vpc = (defaultVpc === true) ? ec2.Vpc.fromLookup(this, 'demo-vpc-default', {
      isDefault: true
    }) :
      new ec2.Vpc(this, 'demo-vpc', {
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
    
    const certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', certArn);

    const appLoadBalancer = new elbv2.ApplicationLoadBalancer(this, 'demo-api-alb', {
      vpc,
      internetFacing: true,
    });

    const albListener = appLoadBalancer.addListener('demo-api-alb-listener', {
      port: 443,
      open: true,
      certificateArns: [ 
        certificate.certificateArn
      ]
    });

    const r53zone = route53.HostedZone.fromLookup(this, 'demo-domain', {
      domainName: domain
    });

    new route53.ARecord(this, 'demo-domain-api', {
      recordName: 'api',
      zone: r53zone,
      target: route53.RecordTarget.fromAlias(new LoadBalancerTarget(appLoadBalancer))
    });

    const ecsCluster = new ecs.Cluster(this, "demo-fargate-api", {
      vpc: vpc
    });

    const fargateTaskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,

    });

    const secret = secretmgr.Secret.fromSecretArn(this, 'demo-api-secrets',
      `arn:aws:secretsmanager:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:secret:${environment}/demo-api-${secretUid}`
    );

    const fargateTask = fargateTaskDefinition.addContainer("demo-ts", {
      image: ecs.ContainerImage.fromEcrRepository(ecrRepo),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: `$demo-api${environment}-logs`,
      }),
      environment: {
        NODE_ENV: secret.secretValueFromJson('NODE_ENV').toString(),
        ss_api_env: secret.secretValue.toString()
      },
      secrets: {
        //Cannot use secrets due to dynamic refs not working, workaround use env as above, but not as secure
      }
    });

    fargateTask.addPortMappings({
      containerPort: 80
    });

    const fargateService = new ecs.FargateService(this, 'Service', {
      cluster: ecsCluster,
      taskDefinition: fargateTaskDefinition,
      desiredCount: 1,
      vpcSubnets: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PUBLIC
      }),
      assignPublicIp: true,

    });

    albListener.addTargets('demo-api-alb-target', {
      port: 80,
      targets: [fargateService],
      deregistrationDelay: Duration.seconds(60),
      healthCheck: {
        path: '/',
        interval: cdk.Duration.minutes(1),
      }
    });

  }
}
