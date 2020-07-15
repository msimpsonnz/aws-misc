import * as cdk from '@aws-cdk/core';

export class ApiStackStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
  }
}

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


export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Import Secret
    const rdsSecretArn = cdk.Fn.importValue("rds-secretArn");
    const rdsSecret =Secret.fromSecretArn(
      this,
      "rds-secretArn",
      rdsSecretArn
    );

    // Lambda to Interact with RDS Proxy
    const rdsLambda = new lambda.Function(this, 'rdsProxyHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.asset('functions/rds'),
      handler: 'index.handler',
      vpc: vpc,
      securityGroups: [sgLambda2Proxy],
      environment: {
        PROXY_ENDPOINT: proxy.endpoint,
        RDS_SECRET_NAME: 'RDSProxyStack-rds-credentials',
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

export class ApiStack extends Stack {
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
        buildCommand: 'npm run build',
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