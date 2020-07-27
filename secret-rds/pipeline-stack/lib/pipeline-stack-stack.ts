import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codecommit from '@aws-cdk/aws-codecommit';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';

export class PipelineStackStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repository = codecommit.Repository.fromRepositoryName(
      this,
      'MyRepository',
      'rds-proxy-repo'
    );

    const cdkOut = new codepipeline.Artifact('cdkOut');

    const buildProject = new codebuild.PipelineProject(this, 'buildProject', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        env: {
          'exported-variables': [
            'APIURL',
          ],
        },
        phases: {
          install: {
            commands: [
              'apt install jq',
              'npm install -g aws-cdk',
              'npm install',
              'npm --prefix ./functions/rds install ./functions/rds'
            ]
          },
          build: {
            commands: [
              'npm run build',
              'echo $ENVIRONMENT',
              'cdk deploy --context environment=$ENVIRONMENT --require-approval=never --verbose --outputs-file cdkout.json',
              'cat cdkout.json',
              "export APIURL=$(cat cdkout.json | jq -r '..| select(type != \"null\")' | grep \"^https\")",
              "echo $APIURL"
            ],
          },
        },
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
      },
    });

    const destroyTestProject = new codebuild.PipelineProject(this, 'destroyTestProject', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        env: {
          'exported-variables': [
            'APIURL',
          ],
        },
        phases: {
          install: {
            commands: [
              'npm install -g aws-cdk',
              'npm install',
            ]
          },
          build: {
            commands: [
              'echo $ENVIRONMENT',
              'cdk destroy --context environment=$ENVIRONMENT --force --verbose',
            ],
          },
        },
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
      },
    });

    const testProject = new codebuild.PipelineProject(this, 'testProject', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
            ]
          },
          build: {
            commands: [
              "echo $APIURL",
              "curl --silent --show-error --fail $APIURL/$COMMIT_ID"
            ],
          },
        },
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
      },
    });

    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.CodeCommitSourceAction({
      actionName: 'CodeCommit',
      repository,
      output: sourceOutput,
    });
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'DeployTest',
      project: buildProject,
      input: sourceOutput,
      environmentVariables: {
        ENVIRONMENT: {
          value: 'TEST',
        },
      },
    });
    const testAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Test',
      type: codepipeline_actions.CodeBuildActionType.TEST,
      project: testProject,
      input: sourceOutput,
      environmentVariables: {
        COMMIT_ID: {
          value: sourceAction.variables.commitId,
        },
        APIURL: {
          value: buildAction.variable('APIURL'),
        },
      },
    });
    const destroyTest = new codepipeline_actions.CodeBuildAction({
      actionName: 'DestroyTest',
      project: destroyTestProject,
      input: sourceOutput,
      environmentVariables: {
        ENVIRONMENT: {
          value: 'TEST',
        }
      }
    });
    const approval = new codepipeline_actions.ManualApprovalAction({
      actionName: 'Approval'
    })
    const deployProd = new codepipeline_actions.CodeBuildAction({
      actionName: 'DeployProd',
      project: buildProject,
      input: sourceOutput,
      environmentVariables: {
        ENVIRONMENT: {
          value: 'PROD',
        },
      },
    });

    const pipeline = new codepipeline.Pipeline(this, 'MyPipeline', {
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction],
        },
        {
          stageName: 'DeployTest',
          actions: [buildAction],
        },
        {
          stageName: 'TestTest',
          actions: [testAction],
        },
        {
          stageName: 'ApprovalDestroyTest',
          actions: [approval],
        },
        // {
        //   stageName: 'DestroyTest',
        //   actions: [destroyTest],
        // },
        {
          stageName: 'ApprovalDeployProd',
          actions: [approval],
        },
        {
          stageName: 'DeployProd',
          actions: [deployProd],
        },
        {
          stageName: 'TestProd',
          actions: [testAction],
        },
      ],
    });

    pipeline.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'));

    buildProject.role?.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'));
    destroyTestProject.role?.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'));


  }
}
