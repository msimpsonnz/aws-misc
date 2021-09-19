import {
  aws_iam as iam,
  aws_ec2 as ec2,
  aws_s3 as s3,
  aws_cloudwatch as cloudwatch,
  aws_synthetics as synthetics,
  aws_fis as fis,
  Stack,
  StackProps,
  Duration,
  Fn,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class FisDemoInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'vpc', {
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'Ingress',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // Node server for EC2
    const nodeServer =
      'https://gist.githubusercontent.com/msimpsonnz/c936d187d9ea555f99ed62ec2eae0fd0/raw/a75e44bc629ea5ba223ed03088eecf826b09247d/server.js';
    //Enable SSH to EC2 if required
    const enableSSH = false;

    //####### EC2 and Security Groups #######//
    const webServerSecurityGroup = new ec2.SecurityGroup(
      this,
      'webServerSecurityGroup',
      {
        vpc,
        securityGroupName: 'webServerSecurityGroup',
        description: 'Allow port 80',
        allowAllOutbound: true,
      }
    );
    webServerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'allow public http access'
    );
    if (enableSSH) {
      webServerSecurityGroup.addIngressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(22),
        'allow public ssh access'
      );
    }

    const ec2UserData = ec2.UserData.forLinux();
    ec2UserData.addCommands(
      'yum install -y gcc-c++ make',
      'curl -sL https://rpm.nodesource.com/setup_14.x | sudo -E bash -',
      'yum install -y nodejs',
      'npm install pm2 -g',
      'mkdir /opt/node',
      'cd /opt/node',
      'npm i bcrypt',
      `curl ${nodeServer} -o /opt/node/server.js`,
      `crontab -l | { cat; echo "@reboot sudo pm2 start /opt/node/server.js -i 0 --name \"server\""; } | crontab -`,
      'pm2 start /opt/node/server.js -i 0 --name "server"',
      'pm2 save',
      'pm2 startup'
    );

    const role_webServer_ssm = new iam.Role(this, 'role_webServer_ssm', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    const webServer = new ec2.Instance(this, 'webServer', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.M5,
        ec2.InstanceSize.LARGE
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      vpc: vpc,
      securityGroup: webServerSecurityGroup,
      userData: ec2UserData,
      role: role_webServer_ssm,
    });

    const logsCanary = new s3.Bucket(this, 'logsCanary');

    const roleCanary = new iam.Role(this, 'roleCanary', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    roleCanary.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ['*'],
        actions: [
          's3:PutObject',
          's3:GetBucketLocation',
          's3:ListAllMyBuckets',
          'cloudwatch:PutMetricData',
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
      })
    );

    const canary = new synthetics.CfnCanary(this, 'canary', {
      name: 'fis-canary',
      code: {
        handler: 'pageLoadBlueprint.handler',
        script: `var synthetics = require('Synthetics');\nconst log = require('SyntheticsLogger');\n\nconst pageLoadBlueprint = async function () {\n\n    // INSERT URL here\n    const URL = 'http://${webServer.instancePublicDnsName}/15';\n\n    let page = await synthetics.getPage();\n    const response = await page.goto(URL, {waitUntil: 'domcontentloaded', timeout: 3700});\n    //Wait for page to render.\n    //Increase or decrease wait time based on endpoint being monitored.\n    await page.waitFor(200);\n    await synthetics.takeScreenshot('loaded', 'loaded');\n    let pageTitle = await page.title();\n    log.info('Page title: ' + pageTitle);\n    if (response.status() !== 200) {\n        throw \"Failed to load page!\";\n    }\n};\n\nexports.handler = async () => {\n    return await pageLoadBlueprint();\n};\n`,
      },
      executionRoleArn: roleCanary.roleArn,
      artifactS3Location: logsCanary.s3UrlForObject('results'),
      runtimeVersion: 'syn-nodejs-puppeteer-3.2',
      schedule: {
        expression: 'rate(1 minute)',
        //durationInSeconds: "3600"
      },
      startCanaryAfterCreation: true,
    });

    const roleFis = new iam.Role(this, 'roleFis', {
      assumedBy: new iam.ServicePrincipal('fis.amazonaws.com'),
    });

    roleFis.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ['*'],
        actions: ['rds:*', 'ec2:*'],
      })
    );

    roleFis.addToPolicy(
      new iam.PolicyStatement({
        resources: ['*'],
        actions: ['ssm:SendCommand', 'ssm:ListCommands', 'ssm:CancelCommands'],
      })
    );

    const alarm = new cloudwatch.Alarm(this, 'cw-alarm', {
      alarmName: 'CloudWatchSyntheticsFailed',
      metric: new cloudwatch.Metric({
        metricName: 'Failed',
        namespace: 'CloudWatchSynthetics',
        dimensionsMap: {
          CanaryName: canary.name,
        },
      }).with({
        period: Duration.minutes(1),
      }),
      threshold: 1,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      datapointsToAlarm: 1,
    });

    const cpuStressAction = {
      actionId: 'aws:ssm:send-command',
      description: 'burn cpu vis SSM',
      parameters: {
        documentArn: `arn:aws:ssm:${this.region}::document/AWSFIS-Run-CPU-Stress`,
        documentParameters: JSON.stringify({
          DurationSeconds: '300',
          InstallDependencies: 'True',
        }),
        duration: 'PT15M',
      },
      targets: { Instances: 'instanceTargets' },
    };

    const target: fis.CfnExperimentTemplate.ExperimentTemplateTargetProperty = {
      resourceType: 'aws:ec2:instance',
      selectionMode: 'ALL',
      resourceArns: [
        `arn:aws:ec2:${this.region}:${this.account}:instance/${webServer.instanceId}`,
      ],
    };

    const templateCpuStress = new fis.CfnExperimentTemplate(
      this,
      'fis-template-demo-cpu-stress',
      {
        description: 'Demo for injecting CPU stress via SSM',
        roleArn: roleFis.roleArn,
        stopConditions: [
          {
            source: 'aws:cloudwatch:alarm',
            value: alarm.alarmArn,
          },
        ],
        tags: { Name: 'CpuStressViaSSM' },
        actions: {
          instanceActions: cpuStressAction,
        },
        targets: {
          instanceTargets: target,
        },
      }
    );
  }
}
