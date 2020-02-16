import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import ec2 = require("@aws-cdk/aws-ec2");
import ecs = require("@aws-cdk/aws-ecs");
import ecr = require('@aws-cdk/aws-ecr');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import { Duration } from '@aws-cdk/core';
import secretmgr = require('@aws-cdk/aws-secretsmanager');
import acm = require('@aws-cdk/aws-certificatemanager');
import route53 = require('@aws-cdk/aws-route53');
import { Alarm, ComparisonOperator } from '@aws-cdk/aws-cloudwatch';
import sns = require('@aws-cdk/aws-sns');
import lambda = require('@aws-cdk/aws-lambda')
import { EnvironmentConfig } from './helper';
import events = require('@aws-cdk/aws-events');
import targets = require('@aws-cdk/aws-events-targets');
import { Schedule, RuleTargetInput } from '@aws-cdk/aws-events';

export class ApiFargateStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //Load our context variables from cdk.json or via CLI
    const config = new EnvironmentConfig(this.node);

    //Some addition conditional variables for different config.environment s
    const albName = `api-alb-${config.environment}`;
    //We need to provide a public host name for our application that will not clash
    const apiHostName = (config.environment === 'prod') ? 'api' : `api.${config.environment}`;
    const apiFqdn = `${apiHostName}.${config.domain}`;
    //We will use the `latest` image tag for anything other than prod
    const imageTag = (config.environment === 'prod') ? config.environment : 'latest';

    //First we import all of the resources created outsite of CDK
    //Generate the ARN for the certificate from AWS Cert Manager then import it
    const certArn = `arn:aws:acm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:certificate/${config.certId}`;
    const certificate = acm.Certificate.fromCertificateArn(this, 'api-certificate', certArn);
    //Import the Route 53 hosted zone for out public domain
    const r53zone = route53.HostedZone.fromLookup(this, 'r53-domain', {
      domainName: config.domain
    });
    //Import the ECR repo where the container image is stored
    const ecrRepo = ecr.Repository.fromRepositoryName(this, 'api-ecr', config.imageName);
    //Import our Secret Manager Secret for use within the application
    const secret = secretmgr.Secret.fromSecretArn(this, 'api-secrets',
      `arn:aws:secretsmanager:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:secret:${config.secretName}`
    );

    //Import RDS security group
    const rdsSec = ec2.SecurityGroup.fromSecurityGroupId(this, 'rds-subnet', config.rdsSecurityGroup)

    //We need a VPC - this will use the default VPC but can overide to create a new dedicated VPC
    const vpc = (config.defaultVpc === true) ? ec2.Vpc.fromLookup(this, 'vpc-default', {
      isDefault: true
    }) :
      new ec2.Vpc(this, 'vpc', {
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

    //Application load balancer will be the public entry point the the application
    //Deployed in the VPC from above and configured as internet facing with public IP
    const appLoadBalancer = new elbv2.ApplicationLoadBalancer(this, 'api-alb', {
      loadBalancerName: albName,
      vpc,
      internetFacing: true,
    });
    //We need a listener for the public side this is then bound to the imported certificate
    const albListener = appLoadBalancer.addListener('api-alb-listener', {
      port: config.albPort,
      open: true,
      certificateArns: [
        certificate.certificateArn,
      ]
    });

    //Now the ALB setup is complete we create a Route 53 record in our imported zone and alias to the ALB
    new route53.CfnRecordSet(this, 'api-r53-alb', {
      hostedZoneName: `${r53zone.zoneName}.`,
      name: apiFqdn,
      type: 'A',
      aliasTarget: {
        dnsName: appLoadBalancer.loadBalancerDnsName,
        hostedZoneId: appLoadBalancer.loadBalancerCanonicalHostedZoneId
      },
      weight: 100,
      setIdentifier: `api-${config.environment}`
    });

    //Create a ECS cluster in the VPC provided
    const ecsCluster = new ecs.Cluster(this, "api-ecs", {
      clusterName: `api-${config.environment}-ecs`,
      vpc: vpc
    });

    //Create Fargate Task Definition
    const fargateTaskDefinition = new ecs.FargateTaskDefinition(this, 'fargate-task-def', {
      memoryLimitMiB: config.fargateMB,
      cpu: config.fargateCPU
    });

    //Create Fargate Task Definition
    //Use image from ECR, setup logging to CloudWatch with custom prefix, get config.environment  variables from Secret Mgr
    const fargateTask = fargateTaskDefinition.addContainer('ts-container', {
      image: ecs.ContainerImage.fromEcrRepository(ecrRepo, imageTag),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: `$api-${config.environment}-logs`,
      }),
      environment: {
        NODE_ENV: config.environment,
        AWS_DEPLOY: secret.secretValueFromJson('AWS_DEPLOY').toString(),
        yes_definitely_send_mail: (config.environment === 'prod') ? 'yesplease' : 'nothanks'

      },
      secrets: {
        SS_API_ENV: ecs.Secret.fromSecretsManager(secret)
      }
    });

    //Add a port mapping to the container this exposes the port for the ALB to use
    fargateTask.addPortMappings({
      containerPort: config.fargatePort
    });

    //Crearte a Fargate service to run the Task Def
    //Add to ECS, cluster with task def, no# of replicas
    //Deployed in VPC and assigned public IP to access ECR without need for NAT
    const fargateService = new ecs.FargateService(this, 'api-fargate-svc', {
      cluster: ecsCluster,
      serviceName: `api-${config.environment}-svc`,
      taskDefinition: fargateTaskDefinition,
      desiredCount: config.fargateReplica,
      vpcSubnets: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PUBLIC
      }),
      assignPublicIp: true
    });

    //Update RDS Security Group with rule to allow Fargate
    rdsSec.addIngressRule(
      fargateService.connections.securityGroups[0],
      ec2.Port.tcp(5432),
      `allow DB access from Fargate ${config.environment}`);

    //Add the Fargate service as a target for the ALB
    //Deregistration delay for draining connections during CD and provide health check
    const albTarget = albListener.addTargets('api-alb-target', {
      port: config.fargatePort,
      //hostHeader: apiFqdn,
      //pathPattern: '/*',
      //priority: (config.environment === 'prod') ? 0 : config.environment.length,
      targets: [fargateService],
      deregistrationDelay: Duration.seconds(config.albDelay),
      healthCheck: {
        path: config.albHealthPath,
        interval: cdk.Duration.seconds(config.albHealthInterval),
      }
    });

    //albTarget.addTarget(fargateService);

    //Setup autoscaling based on CPU% for production
    if (config.environment === 'prod') {
      const scaling = fargateService.autoScaleTaskCount({ maxCapacity: 2 });
      scaling.scaleOnCpuUtilization('api-scalingCPU', {
        targetUtilizationPercent: config.fargateScaleCPU
      });
      scaling.scaleOnMemoryUtilization('api-scalingMem', {
        targetUtilizationPercent: config.fargateScaleMem
      });
      scaling.scaleOnRequestCount('api-scalingReq', {
        requestsPerTarget: config.fargateScaleReq,
        targetGroup: albTarget
      });
    }

    //Setup CloudWatch Alarms for Fargate
    const alarmTopic = new sns.Topic(this, 'api-alarmTopic', {
      topicName: `api-${config.environment}-alarmTopic`
    });

    const alarmCPU = new Alarm(this, 'api-alarmCPU', {
      alarmName: `api-${config.environment}-alarm-High-CPU`,
      metric: fargateService.metricCpuUtilization(),
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      threshold: 80,
      evaluationPeriods: 1
    });

    alarmCPU.addAlarmAction({
      bind(scope, alarm) {
        return { alarmActionArn: alarmTopic.topicArn };
      },
    });

    const alarmMem = new Alarm(this, 'api-alarmMem', {
      alarmName: `api-${config.environment}-alarm-High-Mem`,
      metric: fargateService.metricMemoryUtilization(),
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      threshold: 80,
      evaluationPeriods: 1,

    });

    alarmMem.addAlarmAction({
      bind(scope, alarm) {
        return { alarmActionArn: alarmTopic.topicArn };
      },
    });

    const alarmALB = new Alarm(this, 'api-alarmALB', {
      alarmName: `api-${config.environment}-alarm-High-Req`,
      metric: appLoadBalancer.metricActiveConnectionCount(),
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      threshold: 1000,
      evaluationPeriods: 1,

    });

    alarmALB.addAlarmAction({
      bind(scope, alarm) {
        return { alarmActionArn: alarmTopic.topicArn };
      },
    });

    if (config.environment === 'staging') {



      const fargateFunction = new lambda.Function(this, 'ops-api-staging', {
        functionName: 'ops-api-staging',
        runtime: lambda.Runtime.PYTHON_3_7,
        handler: 'ops-fargate-stage.handler',
        code: new lambda.AssetCode('../func/ops-fargate-stage/'),
        environment: {
          ECS_CLUSTER: ecsCluster.clusterName,
          ECS_SERVICE: fargateService.serviceName
        }
      });

      fargateFunction.addToRolePolicy(new iam.PolicyStatement({
        actions: [
          'ecs:UpdateService'],
        resources: [
          `arn:aws:ecs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:service/${ecsCluster.clusterName}/${fargateService.serviceName}`
        ]
      })
      );

      const rule = new events.Rule(this, 'Rule', {
        schedule: Schedule.cron({
          minute: '0',
          hour: '19',
        })
      });
      rule.addTarget(new targets.LambdaFunction(fargateFunction, {
        event: events.RuleTargetInput.fromObject({ count: 1 })
        })
      );
    }

  }
}
