import cdk = require('@aws-cdk/cdk')
import codebuild = require('@aws-cdk/aws-codebuild');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import codepipeline_actions = require('@aws-cdk/aws-codepipeline-actions');
import lambda = require('@aws-cdk/aws-lambda');
import secretsmanager = require('@aws-cdk/aws-secretsmanager');
import ssm = require('@aws-cdk/aws-ssm');

const app = new cdk.App();

const lambdaStack = new cdk.Stack(app, 'LambdaStack', {
  // remove the Stack from `cdk synth` and `cdk deploy`
  // unless you explicitly filter for it
  autoDeploy: false,
});
const lambdaCode = lambda.Code.cfnParameters();
new lambda.Function(lambdaStack, 'Lambda', {
  code: lambdaCode,
  handler: 'main',
  runtime: lambda.Runtime.Go1x,
});
// other resources that your Lambda needs, added to the lambdaStack...

const pipelineStack = new cdk.Stack(app, 'PipelineStack');
const pipeline = new codepipeline.Pipeline(pipelineStack, 'Pipeline');

const secretArnParam = new ssm.ParameterStoreString(pipelineStack, 'secretMgrArn', {
  parameterName: 'secretMgrArn'
}).stringValue;;

const secret = secretsmanager.Secret.import(pipelineStack, 'GitHubAccessToken', {
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
  repo: 'cdk-ci-cd',
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
const cdkBuildProject = new codebuild.Project(pipelineStack, 'CdkBuildProject', {
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

// build your Lambda code, using CodeBuild
// again, this example assumes your Lambda is written in TypeScript/JavaScript -
// make sure to adjust the build environment and/or commands if they don't match your specific situation
const lambdaBuildProject = new codebuild.Project(pipelineStack, 'LambdaBuildProject', {
  environment: {
    buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_GOLANG_1_10,
  },
  buildSpec: {
    version: '0.2',
    phases: {
      install: {
        commands: [
          'ln -s "${CODEBUILD_SRC_DIR}/src/resources" "/go/src/handler"',
          'go get golang.org/x/lint/golint',
          'go get -u github.com/stretchr/testify'
        ]
      },
      pre_build: {
        commands: [
          'cd "/go/src/handler"',
          'go get ./...',
          'golint -set_exit_status',
          'go tool vet .',
          'go test .'
        ]
      },
      build: {
        commands: 'go build -o main',
      },
    },
    artifacts: {
      files: 'main'
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