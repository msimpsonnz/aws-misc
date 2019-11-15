import cdk = require('@aws-cdk/core');
import autoscaling = require('@aws-cdk/aws-autoscaling');
import ec2 = require('@aws-cdk/aws-ec2');
import { UserData, AmazonLinuxGeneration } from '@aws-cdk/aws-ec2';
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import { Repository } from '@aws-cdk/aws-ecr';
import { Role, ServicePrincipal, PolicyStatement, ManagedPolicy } from '@aws-cdk/aws-iam';
import lambda = require('@aws-cdk/aws-lambda');
import { Duration, Tag } from '@aws-cdk/core';
import { Code, Runtime } from '@aws-cdk/aws-lambda';
import * as path from 'path';
import events = require('@aws-cdk/aws-events');
import targets = require('@aws-cdk/aws-events-targets')


export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'ss-vpc-default', {
      isDefault: true
    });

    const environment = this.node.tryGetContext("environment");
    const imageName = this.node.tryGetContext("image_name");

    const image = `${ cdk.Aws.ACCOUNT_ID }.dkr.ecr.${ cdk.Aws.REGION }.amazonaws.com/${ imageName }`;

    const repo = Repository.fromRepositoryName(this, 'ss-ecr-api', imageName);

    const shellCommands = UserData.forLinux();
    shellCommands.addCommands('yum install docker jq -y');
    shellCommands.addCommands('systemctl enable docker');
    shellCommands.addCommands('service docker start');
    shellCommands.addCommands(`aws secretsmanager get-secret-value --region ${ cdk.Aws.REGION } --secret-id ${ environment }/ss-api | jq '.SecretString | fromjson' | jq -r 'keys[] as $k | "\\($k)=\\(.[$k] | .)"' > /tmp/docker.env`);
    shellCommands.addCommands(`$(aws ecr get-login --no-include-email --region ${ cdk.Aws.REGION })`);
    shellCommands.addCommands(`docker pull ${ image }`);
    shellCommands.addCommands(`docker run -d -p 80:80 --name demo --restart always --env-file /tmp/docker.env ${ image }`);
    shellCommands.render();

    const ec2Role = new Role(this, 'ss-api-ec2Role', {
      roleName: `ss-${ environment }-api-ec2Role`,
      assumedBy: new ServicePrincipal('ec2.amazonaws.com')
    });

    ec2Role.addToPolicy(new PolicyStatement({
      resources: ['*'],
      actions: [
        'ecr:GetAuthorizationToken',
        'ecr:GetDownloadUrlForLayer',
        'ecr:BatchGetImage',
        'ecr:BatchCheckLayerAvailability'
      ]
    }));

    ec2Role.addToPolicy(new PolicyStatement({
      resources: [`arn:aws:secretsmanager:${ cdk.Aws.REGION }:${ cdk.Aws.ACCOUNT_ID }:secret:${ environment }/ss-api-*`],
      actions: [
        'secretsmanager:GetSecretValue'
      ]
    }));

    const asg = new autoscaling.AutoScalingGroup(this, 'ss-api-ASG', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage({
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2
      }), // get the latest Amazon Linux image
      userData: shellCommands,
      role: ec2Role,
      keyName: 'ap2'
    });

    Tag.add(asg, 'env', environment);


    const lb = new elbv2.ApplicationLoadBalancer(this, 'ss-api-alb', {
      loadBalancerName: `ss-${ environment }-api-alb`,
      vpc,
      internetFacing: true,
      
    });

    const listener = lb.addListener('ss-api-alb-listener', {
      port: 80,
      open: true,
    });

    listener.addTargets('ss-api-alb-target', {
      port: 80,
      targets: [asg],
      deregistrationDelay: Duration.seconds(60)
    });

    const lambdaRole = new Role(this, 'ss-api-autoscale-functionRole', {
      roleName: `ss-${ environment }-api-autoscale-functionRole`,
      assumedBy: new ServicePrincipal('lambda.amazonaws.com')
    });

    lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));

    lambdaRole.addToPolicy(new PolicyStatement({
      resources: ['*'],
      actions: [
        'ec2:Describe*',
        'autoscaling:Describe*',
        'autoscaling:UpdateAutoScalingGroup',
        'autoscaling:SuspendProcesses',
        'autoscaling:ResumeProcesses',
        'autoscaling:SetDesiredCapacity',
        'autoscaling:AttachInstances',
        'autoscaling:TerminateInstanceInAutoScalingGroup',
        'elasticloadbalancing:DescribeTargetHealth',
        'elasticloadbalancing:DeregisterTargets'
      ]
    }));

    const scalingFunction = new lambda.Function(this, 'ss-api-autoscale-function', {
      functionName: `ss-${ environment }-api-autoscale-function`,
      code: Code.fromAsset(path.join(__dirname, '../autoscaler')),
      handler: 'handler.handler',
      runtime: Runtime.PYTHON_3_7,
      timeout: Duration.minutes(15),
      role: lambdaRole,
      environment: {
        autoscaler: asg.autoScalingGroupName
      }
    });

    repo.onCloudTrailImagePushed('pushImage', {
      ruleName: `ss-${ environment }-api-autoscale-cw-rule`,
      target: new targets.LambdaFunction(scalingFunction)
    });

  }
}
