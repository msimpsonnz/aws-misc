import * as cdk from '@aws-cdk/core';
import * as codecommit from '@aws-cdk/aws-codecommit';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as pipelines from '@aws-cdk/pipelines';
import { XrayDemoStage } from './x-ray-demo-stage';
import * as codebuild from '@aws-cdk/aws-codebuild';

export class XrayDemoPipeline extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sourceRepo = new codecommit.Repository(this, 'sourceRepo', {
      repositoryName: 'xray-demo-repo',
    });

    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();

    const pipeline = new pipelines.CdkPipeline(this, 'CdkPipeline', {
      pipelineName: 'cdk-cdkpipeline',
      cloudAssemblyArtifact: cloudAssemblyArtifact,

      sourceAction: new codepipeline_actions.CodeCommitSourceAction({
        actionName: 'Source',
        repository: sourceRepo,
        output: sourceArtifact,
      }),

      synthAction: pipelines.SimpleSynthAction.standardNpmSynth({
        sourceArtifact: sourceArtifact,
        cloudAssemblyArtifact: cloudAssemblyArtifact,
        installCommand: 'npm ci && npm i --prefix func/recordhandler',
        buildCommand: 'npm run build',
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
          privileged: true,
        },
      }),
    });

    pipeline.addApplicationStage(new XrayDemoStage(this, 'prodStage'))

  }
}
