import cdk = require('@aws-cdk/cdk')
import codebuild = require('@aws-cdk/aws-codebuild');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import codepipeline_actions = require('@aws-cdk/aws-codepipeline-actions');
import lambda = require('@aws-cdk/aws-lambda');
import secretsmanager = require('@aws-cdk/aws-secretsmanager');
import ssm = require('@aws-cdk/aws-ssm');

export class CdkStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);


        //const pipelineStack = new cdk.Stack(this, 'PipelineStack');
        const pipeline = new codepipeline.Pipeline(this, 'Pipeline');
        
        const secretArnParam = new ssm.ParameterStoreString(this, 'secretMgrArn', {
          parameterName: 'secretMgrArn'
        }).stringValue;;
        
        const secret = secretsmanager.Secret.import(this, 'GitHubAccessToken', {
          secretArn: secretArnParam
        });
        
        // add the source code repository containing this code to your Pipeline,
        // and the source code of the Lambda Function, if they're separate
        const cdkSourceOutput = new codepipeline.Artifact();
        const cdkSourceAction = new codepipeline_actions.GitHubSourceAction({
          actionName: 'CDK_Source',
          owner: 'msimpsonnz',
          repo: 'sls-net',
          oauthToken: secret.secretJsonValue('GitHubPAT'),
          output: cdkSourceOutput,
          branch: 'master'
        });
        
        const lambdaSourceOutput = new codepipeline.Artifact();
        const lambdaSourceAction = new codepipeline_actions.GitHubSourceAction({
          actionName: 'Lambda_Source',
          owner: 'msimpsonnz',
          repo: 'sls-net',
          oauthToken: secret.secretJsonValue('GitHubPAT'),
          output: lambdaSourceOutput,
          branch: 'master'
        });
        
        pipeline.addStage({
          name: 'Source',
          actions: [cdkSourceAction, lambdaSourceAction],
        });
        
        // synthesize the Lambda CDK template, using CodeBuild
        // the below values are just examples, assuming your CDK code is in TypeScript/JavaScript -
        // adjust the build environment and/or commands accordingly
        const cdkBuildProject = new codebuild.Project(this, 'CdkBuildProject', {
          environment: {
            buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_NODEJS_10_1_0,
          },
          buildSpec: {
            version: '0.2',
            phases: {
              install: {
                commands: [
                  'cd "${CODEBUILD_SRC_DIR}/cdk"',
                  'npm install'
                ]
              },
              build: {
                commands: [
                  'cd "${CODEBUILD_SRC_DIR}/cdk"',
                  'npm run build',
                  'npm run cdk synth LambdaStack -- -o ../',
                ],
              },
            },
            artifacts: {
              files: 'LambdaStack.template.yaml',
            },
          },
        });
        const cdkBuildOutput = new codepipeline.Artifact();
        const cdkBuildAction = new codepipeline_actions.CodeBuildAction({
          actionName: 'CDK_Build',
          project: cdkBuildProject,
          input: cdkSourceOutput,
          output: cdkBuildOutput,
        });
        
        const lambdaBuildProject = new codebuild.Project(this, 'LambdaBuildProject', {
          environment: {
            buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_DOTNET_CORE_2_1
          },
          buildSpec: {
            version: '0.2',
            phases: {
              install: {
                commands: [
                  'pip install --upgrade awscli'
                ]
              },
              pre_build: {
                commands: [
                  'dotnet restore Functions/src/StarterFunc/StarterFunc.csproj'
                ]
              },
              build: {
                commands: 'dotnet publish -c release -o ./build_output Functions/src/StarterFunc/StarterFunc.csproj',
              },
            },
            artifacts: {
              'files': 'Functions/src/StarterFunc/build_output/**/*',
              'discard-paths': 'yes' 
            },
          },
        });
        const lambdaBuildOutput = new codepipeline.Artifact();
        const lambdaBuildAction = new codepipeline_actions.CodeBuildAction({
          actionName: 'Lambda_Build',
          project: lambdaBuildProject,
          input: lambdaSourceOutput,
          output: lambdaBuildOutput,
        });
        
        pipeline.addStage({
          name: 'Build',
          actions: [cdkBuildAction, lambdaBuildAction],
        });
        
        const lambdaCode = lambda.Code.cfnParameters();
        // finally, deploy your Lambda Stack
        pipeline.addStage({
          name: 'Deploy',
          actions: [
            new codepipeline_actions.CloudFormationCreateUpdateStackAction({
              actionName: 'Lambda_CFN_Deploy',
              templatePath: cdkBuildOutput.atPath('LambdaStack.template.yaml'),
              stackName: 'LambdaStackDeployedName',
              adminPermissions: true,
              parameterOverrides: {
                ...lambdaCode.assign(lambdaBuildOutput.s3Coordinates),
              },
              extraInputs: [
                lambdaBuildOutput,
              ],
            }),
          ],
        });



    }
}