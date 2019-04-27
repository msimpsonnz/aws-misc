import cdk = require('@aws-cdk/cdk')
import codebuild = require('@aws-cdk/aws-codebuild');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import codepipeline_actions = require('@aws-cdk/aws-codepipeline-actions');
import lambda = require('@aws-cdk/aws-lambda');
import secretsmanager = require('@aws-cdk/aws-secretsmanager');
import ssm = require('@aws-cdk/aws-ssm');
import apigw = require('@aws-cdk/aws-apigateway');

const app = new cdk.App();

const lambdaStack = new cdk.Stack(app, 'LambdaStack', {
  // remove the Stack from `cdk synth` and `cdk deploy`
  // unless you explicitly filter for it
  autoDeploy: false,
});
const lambdaCode = lambda.Code.cfnParameters();
const StarterFunc = new lambda.Function(lambdaStack, 'Lambda', {
  code: lambdaCode,
  handler: 'StarterFunc::StarterFunc.Functions::Get',
  runtime: lambda.Runtime.DotNetCore21,
});
// const lambdaCode = lambda.Code.cfnParameters();
// const StarterFunc = new lambda.Function(lambdaStack, 'Lambda', {
//   code: lambdaCode,
//   handler: 'main',
//   runtime: lambda.Runtime.Go1x
// });

// other resources that your Lambda needs, added to the lambdaStack...
new apigw.LambdaRestApi(lambdaStack, 'Endpoint', {
  handler: StarterFunc
});

const pipelineStack = new cdk.Stack(app, 'PipelineStack');
//const pipelineGo = new codepipeline.Pipeline(pipelineStack, 'PipelineGo');
const pipelineNet = new codepipeline.Pipeline(pipelineStack, 'PipelineNet');

const secretArnParam = new ssm.ParameterStoreString(pipelineStack, 'secretMgrArn', {
  parameterName: 'secretMgrArn'
}).stringValue;;

const secret = secretsmanager.Secret.import(pipelineStack, 'GitHubAccessToken', {
  secretArn: secretArnParam
});

// add the source code repository containing this code to your Pipeline,
// and the source code of the Lambda Function, if they're separate
const cdkSourceOutput = new codepipeline.Artifact();
const cdkSourceAction = GitHubRepo('CDK_Source', 'sls-net', cdkSourceOutput);

// const lambdaGoSourceOutput = new codepipeline.Artifact();
// const lambdaGoSourceAction = GitHubRepo('Lambda_Source', 'cdk-ci-cd', lambdaGoSourceOutput);

// pipelineGo.addStage({
//   name: 'Source',
//   actions: [cdkSourceAction, lambdaGoSourceAction],
// });

pipelineNet.addStage({
  name: 'Source',
  actions: [cdkSourceAction],
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
// const lambdaGoBuildProject = new codebuild.Project(pipelineStack, 'LambdaGoBuildProject', {
//   environment: {
//     buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_GOLANG_1_10,
//   },
//   buildSpec: {
//     version: '0.2',
//     phases: {
//       install: {
//         commands: [
//           'ln -s "${CODEBUILD_SRC_DIR}/src/resources" "/go/src/handler"',
//           'go get golang.org/x/lint/golint',
//           'go get -u github.com/stretchr/testify'
//         ]
//       },
//       pre_build: {
//         commands: [
//           'cd "/go/src/handler"',
//           'go get ./...',
//           'golint -set_exit_status',
//           'go tool vet .',
//           'go test .'
//         ]
//       },
//       build: {
//         commands: [
//           'mkdir "${CODEBUILD_SRC_DIR}/build-output"',
//           'go build -o "${CODEBUILD_SRC_DIR}/build-output/main"',
//         ]
//       },
//     },
//     artifacts: {
//       'files': 'build-output/**/*',
//       'discard-paths': 'yes' 
//     },
//   },
// });
// const lambdaGoBuildOutput = new codepipeline.Artifact();
// const lambdaGoBuildAction = new codepipeline_actions.CodeBuildAction({
//   actionName: 'LambdaGo_Build',
//   project: lambdaGoBuildProject,
//   input: lambdaGoSourceOutput,
//   output: lambdaGoBuildOutput,
// });

const lambdaNetBuildProject = new codebuild.Project(pipelineStack, 'LambdaNetBuildProject', {
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
const lambdaNetBuildOutput = new codepipeline.Artifact();
const lambdaNetBuildAction = new codepipeline_actions.CodeBuildAction({
  actionName: 'LambdaNet_Build',
  project: lambdaNetBuildProject,
  input: cdkSourceOutput,
  output: lambdaNetBuildOutput,
});

// pipelineGo.addStage({
//   name: 'Build',
//   actions: [cdkBuildAction, lambdaGoBuildAction],
// });

pipelineNet.addStage({
  name: 'Build',
  actions: [cdkBuildAction, lambdaNetBuildAction],
});

// finally, deploy your Lambda Stack
// pipelineGo.addStage({
//   name: 'Deploy',
//   actions: [
//     new codepipeline_actions.CloudFormationCreateUpdateStackAction({
//       actionName: 'LambdaGo_CFN_Deploy',
//       templatePath: cdkBuildOutput.atPath('LambdaStack.template.yaml'),
//       stackName: 'LambdaGoStackDeployedName',
//       adminPermissions: true,
//       parameterOverrides: {
//         ...lambdaCode.assign(lambdaGoBuildOutput.s3Coordinates),
//       },
//       extraInputs: [
//         lambdaGoBuildOutput,
//       ],
//     }),
//   ],
// });

pipelineNet.addStage({
  name: 'Deploy',
  actions: [
    new codepipeline_actions.CloudFormationCreateUpdateStackAction({
      actionName: 'LambdaNet_CFN_Deploy',
      templatePath: cdkBuildOutput.atPath('LambdaStack.template.yaml'),
      stackName: 'LambdaNetStackDeployedName',
      adminPermissions: true,
      parameterOverrides: {
        ...lambdaCode.assign(lambdaNetBuildOutput.s3Coordinates),
      },
      extraInputs: [
        lambdaNetBuildOutput,
      ],
    }),
  ],
});

function GitHubRepo(actionName: string, repo: string, output: codepipeline.Artifact) {
  return new codepipeline_actions.GitHubSourceAction({
    actionName: actionName,
    owner: 'msimpsonnz',
    repo: repo,
    oauthToken: secret.secretJsonValue('GitHubPAT'),
    output: output,
    branch: 'master'
  });
}
