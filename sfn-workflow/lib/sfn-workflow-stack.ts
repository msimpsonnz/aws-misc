import * as cdk from '@aws-cdk/core';
import * as dynamo from '@aws-cdk/aws-dynamodb';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks';
import * as iam from '@aws-cdk/aws-iam';
import * as apigw from '@aws-cdk/aws-apigateway';

export class SfnWorkflowStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DDB Table for records
    const table = new dynamo.Table(this, 'table', {
      partitionKey: {
        name: 'pk',
        type: dynamo.AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: dynamo.AttributeType.STRING,
      },
      billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Sfn Task to write to context to DDB as example
    const sfnTaskDDBPut = new tasks.DynamoPutItem(this, id, {
      item: {
        pk: tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt('$$.Execution.Id')
        ),
        sk: tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt('$')
        ),
      },
      table,
    });

    const map = new sfn.Map(this, 'Map State', {
      maxConcurrency: 10,
      itemsPath: sfn.JsonPath.entirePayload,
    });
    map.iterator(sfnTaskDDBPut);

    const sfnChain = sfn.Chain
      .start(map);


    // Parent Sfn using Standard workflow
    const sfnParent = new sfn.StateMachine(this, 'sfnParent', {
      stateMachineType: sfn.StateMachineType.STANDARD,
      definition: sfnChain,
      timeout: cdk.Duration.seconds(30),
    });

    table.grantReadWriteData(sfnParent.role);


    //#########################################################



    // API Gateway
    const api = new apigw.RestApi(this, 'api', {
      restApiName: this.stackId
    });

    const intergrationAPI = api.root.addResource('executions', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: apigw.Cors.DEFAULT_HEADERS,
      },
    });

    const roleApiSfn = new iam.Role(this, 'roleApiSfn', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    });

    roleApiSfn.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AWSStepFunctionsFullAccess'
      )
    );

    const sfnIntegration = new apigw.AwsIntegration({
      service: 'states',
      action: 'StartExecution',
      options: {
        credentialsRole: roleApiSfn,
        requestTemplates: {
          'application/json': JSON.stringify({
              "input": "$util.escapeJavaScript($input.json('$'))",
              "stateMachineArn": sfnParent.stateMachineArn
          }),
        },
        integrationResponses: [
          {
            statusCode: '200',
          },
        ],
      },
    });

    intergrationAPI.addMethod('POST', sfnIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigw.Model.EMPTY_MODEL,
          },
        },
      ],
    });

    const roleApiDdb = new iam.Role(this, 'roleApiDdb', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    });

    roleApiDdb.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AmazonDynamoDBFullAccess'
      )
    );

    const ddbIntegration = new apigw.AwsIntegration({
      service: 'dynamodb',
      action: 'Scan',
      options: {
        credentialsRole: roleApiDdb,
        requestTemplates: {
          'application/json': JSON.stringify({
              TableName: table.tableName,
          }),
        },
        integrationResponses: [
          {
            statusCode: '200',
          },
        ],
      },
    });

    intergrationAPI.addMethod('GET', ddbIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigw.Model.EMPTY_MODEL,
          },
        },
      ],
    });

  }

}
