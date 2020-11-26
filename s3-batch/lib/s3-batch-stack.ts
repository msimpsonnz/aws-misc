import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as lambdaNode from '@aws-cdk/aws-lambda-nodejs';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks';
import * as apigw from '@aws-cdk/aws-apigatewayv2';

export class S3BatchStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const s3SourceBucket = new s3.Bucket(this, 's3SourceBucket');
    const s3ExtractBucket = new s3.Bucket(this, 's3ExtractBucket');

    const table = new dynamodb.Table(this, 'table', {
      partitionKey: {
        name: 'pk',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const fnManifestBatch = new lambdaNode.NodejsFunction(
      this,
      'fnManifestBatch',
      {
        runtime: lambda.Runtime.NODEJS_12_X,
        entry: './functions/manifestBatch/index.ts',
        handler: 'handler',
        environment: {
          AWS_S3_BUCKET_NAME: s3ExtractBucket.bucketName,
        },
      }
    );
    s3ExtractBucket.grantReadWrite(fnManifestBatch);

    const fnMetadataMapper = new lambdaNode.NodejsFunction(
      this,
      'fnMetadataMapper',
      {
        runtime: lambda.Runtime.NODEJS_12_X,
        entry: './functions/metadataMapper/index.ts',
        handler: 'handler',
        environment: {
          AWS_S3_BUCKET_NAME: s3ExtractBucket.bucketName,
          AWS_DYNAMODB_TABLE_NAME: table.tableName,
        },
      }
    );
    s3ExtractBucket.grantReadWrite(fnMetadataMapper);
    table.grantReadWriteData(fnMetadataMapper);

    const fnbatchCopy = new lambda.Function(this, 'fnbatchCopy', {
      runtime: lambda.Runtime.PYTHON_3_8,
      timeout: cdk.Duration.seconds(20),
      handler: 'index.handler',
      code: lambda.Code.fromAsset('./functions/batchCopy', {
        // bundling: {
        //   image: lambda.Runtime.PYTHON_3_8.bundlingDockerImage,
        //   command: [
        //     'bash', '-c', `
        //     pip install -r requirements.txt -t /asset-output &&
        //     cp -au . /asset-output
        //     `,
        //   ],
        //   user: 'root',
        // },
      }),
      environment: {
        AWS_S3_BUCKET_NAME: s3ExtractBucket.bucketName,
      },
    });
    s3SourceBucket.grantRead(fnbatchCopy);
    s3ExtractBucket.grantReadWrite(fnbatchCopy);

    const roleBatch = new iam.Role(this, 'roleBatch', {
      assumedBy: new iam.ServicePrincipal('batchoperations.s3.amazonaws.com'),
    });

    roleBatch.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [`${s3ExtractBucket.bucketArn}/*`],
        actions: [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:GetBucketLocation",
          "s3:PutObject",
        ],
      })
    );

    roleBatch.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [fnbatchCopy.functionArn],
        actions: ['lambda:*'],
      })
    );

    const rolefncreateJob = new iam.Role(this, 'rolefncreateJob', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    rolefncreateJob.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole'
      )
    );

    rolefncreateJob.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ['*'],
        actions: [
          'iam:PassRole',
          's3:CreateJob'
        ],
      })
    );

    const fncreateJob = new lambdaNode.NodejsFunction(this, 'fncreateJob', {
      runtime: lambda.Runtime.NODEJS_12_X,
      entry: './functions/createJob/index.ts',
      handler: 'handler',
      //role: rolefncreateJob,
      environment: {
        AWS_ACCOUNT_ID: cdk.Aws.ACCOUNT_ID,
        AWS_BATCH_FN_ARN: fnbatchCopy.functionArn,
        AWS_BATCH_ROLE_ARN: roleBatch.roleArn,
        AWS_S3_BUCKET_NAME: s3ExtractBucket.bucketName,
        //AWS_DYNAMODB_TABLE_NAME: table.tableName,
      },
    });
    s3ExtractBucket.grantReadWrite(fnMetadataMapper);
    table.grantReadWriteData(fnMetadataMapper);

    const taskfnManifestBatch = new tasks.LambdaInvoke(
      this,
      'taskfnManifestBatch',
      {
        lambdaFunction: fnManifestBatch,
        payload: sfn.TaskInput.fromObject({
          'id.$': '$$.Execution.Id',
          Records: sfn.JsonPath.stringAt('$.Records'),
        }),
      }
    );

    const taskfnMetadataMapper = new tasks.LambdaInvoke(
      this,
      'taskfnMetadataMapper',
      {
        lambdaFunction: fnMetadataMapper,
        payload: sfn.TaskInput.fromObject({
          'id.$': '$$.Execution.Id',
          batchFile: sfn.JsonPath.stringAt('$.batchFile'),
        }),
        resultPath: '$.manifests',
      }
    );

    const taskfncreateJob = new tasks.LambdaInvoke(this, 'taskfncreateJob', {
      lambdaFunction: fncreateJob,
      payload: sfn.TaskInput.fromObject({
        'id.$': '$$.Execution.Id',
        manifests: sfn.JsonPath.stringAt('$'),
      }),
    });

    const sfnMapMetadata = new sfn.Map(this, 'sfnMapMetadata', {
      maxConcurrency: 10,
      itemsPath: sfn.JsonPath.stringAt('$.Payload.batchList'),
    });
    sfnMapMetadata.iterator(taskfnMetadataMapper);

    // const sfnMapBatchJob = new sfn.Map(this, 'sfnMapBatchJob', {
    //   maxConcurrency: 10,
    //   itemsPath: sfn.JsonPath.stringAt('$'),
    //   parameters: {
    //     batchId: sfn.JsonPath.stringAt('$$.Map.Item.Index'),
    //     'id.$': '$$.Execution.Id',
    //   }
    // });
    // sfnMapBatchJob.iterator(taskfncreateJob);

    const definition = sfn.Chain.start(taskfnManifestBatch)
      .next(sfnMapMetadata)
      .next(taskfncreateJob);

    const sfnWorkflow = new sfn.StateMachine(this, 'sfnWorkflow', {
      definition,
    });

    const apiHttp = new apigw.HttpApi(this, 'apiHttp');

    const roleApiHttp = new iam.Role(this, 'roleApiHttp', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    });

    roleApiHttp.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [sfnWorkflow.stateMachineArn],
        actions: ['states:StartExecution'],
      })
    );

    const apiGatewayIntegration = new apigw.CfnIntegration(
      this,
      'apiGatewayIntegration',
      {
        apiId: apiHttp.httpApiId,
        integrationSubtype: 'StepFunctions-StartExecution',
        integrationType: 'AWS_PROXY',
        payloadFormatVersion: '1.0',
        credentialsArn: roleApiHttp.roleArn,
        requestParameters: {
          StateMachineArn: sfnWorkflow.stateMachineArn,
          Input: '$request.body',
        },
      }
    );

    new apigw.CfnRoute(this, 'apiRouteSQS', {
      apiId: apiHttp.httpApiId,
      routeKey: 'POST /workflow',
      target: `integrations/${apiGatewayIntegration.ref}`,
    });
  }
}
