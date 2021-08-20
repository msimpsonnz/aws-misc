import {
  aws_iam as iam,
  aws_ec2 as ec2,
  aws_rds as rds,
  aws_lambda_nodejs as lambda_node,
  aws_apigateway as apigateway,
  aws_s3 as s3,
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
    });

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'dbSecurityGroup', {
      vpc,
    });
    dbSecurityGroup.addIngressRule(dbSecurityGroup, ec2.Port.tcp(5432));

    const clusterIdentifier = 'fisdemoinfrastack-databaseb269d8bb-1s37mv1sw452i';

    const cluster = new rds.DatabaseCluster(this, 'Database', {
      //clusterIdentifier: clusterIdentifier,
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_12_6,
      }),
      defaultDatabaseName: 'demo',
      credentials: rds.Credentials.fromGeneratedSecret('clusteradmin'),
      instanceProps: {
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE,
        },
        vpc,
        securityGroups: [dbSecurityGroup],
      },
    });

    const fnGetPosts = new lambda_node.NodejsFunction(this, 'fnGetPosts', {
      entry: './functions/index.ts',
      timeout: Duration.seconds(5),
      bundling: {
        nodeModules: ['@prisma/client', 'prisma'],
        commandHooks: {
          beforeBundling(inputDir: string, outputDir: string): string[] {
            return [];
          },
          beforeInstall(inputDir: string, outputDir: string) {
            return [`cp -R ${inputDir}/prisma ${outputDir}/`];
          },
          afterBundling(inputDir: string, outputDir: string): string[] {
            return [
              `cd ${outputDir}`,
              `yarn prisma generate`,
              `rm -rf node_modules/@prisma/engines`,
              `rm -rf node_modules/@prisma/client/node_modules node_modules/.bin node_modules/prisma`,
            ];
          },
        },
      },
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE,
      },
      securityGroups: [dbSecurityGroup],
      environment: {
        DATABASE_URL: `postgresql://clusteradmin:${cluster.secret?.secretValueFromJson(
          'password'
        )}@${cluster.clusterEndpoint.hostname}/demo?schema=public`,
      },
    });

    const api = new apigateway.LambdaRestApi(this, 'api', {
      handler: fnGetPosts,
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
          "s3:PutObject",
          "s3:GetBucketLocation",      
          "s3:ListAllMyBuckets",   
          "cloudwatch:PutMetricData",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
      })
    );

    const canary = new synthetics.CfnCanary(this, 'canary', {
      name: 'fis-canary',
      code: {
        handler: "pageLoadBlueprint.handler",
        script: `var synthetics = require('Synthetics');\nconst log = require('SyntheticsLogger');\n\nconst pageLoadBlueprint = async function () {\n\n    // INSERT URL here\n    const URL = '${api.url}';\n\n    let page = await synthetics.getPage();\n    const response = await page.goto(URL, {waitUntil: 'domcontentloaded', timeout: 30000});\n    //Wait for page to render.\n    //Increase or decrease wait time based on endpoint being monitored.\n    await page.waitFor(15000);\n    await synthetics.takeScreenshot('loaded', 'loaded');\n    let pageTitle = await page.title();\n    log.info('Page title: ' + pageTitle);\n    if (response.status() !== 200) {\n        throw \"Failed to load page!\";\n    }\n};\n\nexports.handler = async () => {\n    return await pageLoadBlueprint();\n};\n`
      },
      executionRoleArn: roleCanary.roleArn,
      artifactS3Location: logsCanary.s3UrlForObject('results'),
      runtimeVersion: "syn-nodejs-puppeteer-3.2",
      schedule: {
        expression: "rate(1 minute)"
        //durationInSeconds: "3600"
      },
      startCanaryAfterCreation: true
    });

    const roleFis = new iam.Role(this, 'roleFis', {
      assumedBy: new iam.ServicePrincipal('fis.amazonaws.com'),
    });

    roleFis.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ['*'],
        actions: [
          "rds:*",
        ],
      })
    );

    const action = {
      actionId: 'aws:rds:failover-db-cluster',
      // parameters: { startInstancesAfterDuration: 'PT1M' },
      targets: { Clusters: 'clusterTargets'}
    }

    const target: fis.CfnExperimentTemplate.ExperimentTemplateTargetProperty = {
      resourceType: 'aws:rds:cluster',
      selectionMode: 'ALL',
      resourceArns:
         [
          `arn:aws:rds:${this.region}:${this.account}:cluster:${clusterIdentifier}`
        ]
    }

    const template = new fis.CfnExperimentTemplate(this,'fis-template-demo-rds-failover', {
      description: 'Demo for failover Aurora Cluster',
      roleArn: roleFis.roleArn,
      stopConditions: [
        { source: 'none' }
      ],
      tags: { Name: 'FailoverAurora'},
      actions: {
        'clusterActions' : action
      },
      targets: {
        'clusterTargets': target
      }
    });
    
  }
}
