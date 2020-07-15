// Forked from https://github.com/cdk-patterns/serverless/tree/master/the-rds-proxy
import { CfnOutput, Construct, RemovalPolicy, Stack, StackProps, Stage, StageProps } from '@aws-cdk/core';
import { CdkPipeline, SimpleSynthAction } from '@aws-cdk/pipelines';
import {
  InstanceClass,
  InstanceType,
  InstanceSize,
  Port,
  SecurityGroup,
  Vpc,
} from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
import { Secret } from '@aws-cdk/aws-secretsmanager';
import { StringParameter } from '@aws-cdk/aws-ssm';
import * as lambda from '@aws-cdk/aws-lambda';
import apigw = require('@aws-cdk/aws-apigatewayv2');
import codepipeline = require('@aws-cdk/aws-codepipeline')
import codepipeline_actions = require('@aws-cdk/aws-codepipeline-actions')
import codecommit = require('@aws-cdk/aws-codecommit')


class RDSProxyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Setup networking
    const vpc = new Vpc(this, 'Vpc');
    // Add Security Groups
    const sgLambda2Proxy = new SecurityGroup(this, 'sgLambda2Proxy', { vpc });
    const sgProxy2RDS = new SecurityGroup(this, 'sgProxy2RDS', { vpc });
    sgProxy2RDS.addIngressRule(sgProxy2RDS, Port.tcp(3306));
    sgProxy2RDS.addIngressRule(sgLambda2Proxy, Port.tcp(3306));

    const secretRDS = new Secret(this, 'secretRDS', {
      secretName: id + '-rds-credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'rdsuser',
        }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: 'password',
      },
    });

    new StringParameter(this, 'ssmParamSecretRDSArn', {
      parameterName: 'demo-secret-rds',
      stringValue: secretRDS.secretArn,
    });

    const rdsInstance = new rds.DatabaseInstance(this, 'DBInstance', {
      engine: rds.DatabaseInstanceEngine.MYSQL,
      masterUsername: secretRDS.secretValueFromJson('username').toString(),
      masterUserPassword: secretRDS.secretValueFromJson('password'),
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE2,
        InstanceSize.SMALL
      ),
      vpc,
      removalPolicy: RemovalPolicy.DESTROY,
      deletionProtection: false,
      securityGroups: [sgProxy2RDS],
    });

    // Create an RDS Proxy
    const proxy = rdsInstance.addProxy(id + '-proxy', {
      secret: secretRDS,
      debugLogging: true,
      vpc,
      securityGroups: [sgProxy2RDS],
    });

    // Workaround for bug where TargetGroupName is not set but required
    let targetGroup = proxy.node.children.find((child: any) => {
      return child instanceof rds.CfnDBProxyTargetGroup;
    }) as rds.CfnDBProxyTargetGroup;

    targetGroup.addPropertyOverride('TargetGroupName', 'default');

    // Lambda to Interact with RDS Proxy
    const rdsLambda = new lambda.Function(this, 'rdsProxyHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.asset('functions/rds'),
      handler: 'index.handler',
      vpc: vpc,
      securityGroups: [sgLambda2Proxy],
      environment: {
        PROXY_ENDPOINT: proxy.endpoint,
        RDS_SECRET_NAME: id + '-rds-credentials',
      },
    });

    secretRDS.grantRead(rdsLambda);

    // defines an API Gateway Http API resource backed by our "rdsLambda" function.
    const api = new apigw.HttpApi(this, 'Endpoint', {
      defaultIntegration: new apigw.LambdaProxyIntegration({
        handler: rdsLambda,
      }),
      createDefaultStage: true,
    });

    const apiURL = new CfnOutput(this, 'apiURL', {
      value: api.url ?? 'ERROR with deployment'
    });
  }
}

class SecretRdsPipelineStack extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    new RDSProxyStack(this, 'rdsProxyStack', {
      env: {
        account: '383358879677',
        region: 'ap-southeast-2',
      }
    });
  }
}

export class SecretRdsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const sourceRepo = codecommit.Repository.fromRepositoryName(this, 'sourceRepo', 'rds-secret-demo')

    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();

    const pipeline = new CdkPipeline(this, 'Pipeline', {
      pipelineName: 'SecretRdsPipelineStack',
      cloudAssemblyArtifact,
      sourceAction: new codepipeline_actions.CodeCommitSourceAction({
        actionName: 'CodeCommit',
        repository: sourceRepo,
        output: sourceArtifact,
      }),
      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,

        // Use this if you need a build step (if you're not using ts-node
        // or if you have TypeScript Lambdas that need to be compiled).
        buildCommand: 'cd ./secret-rds && npm run build',
      }),
      



    });

    // Do this as many times as necessary with any account and region
    // Account and region may different from the pipeline's.
    pipeline.addApplicationStage(new SecretRdsPipelineStack(this, 'Prod', {
      env: {
        account: '383358879677',
        region: 'ap-southeast-2',
      }
    }));
  }
}  