import * as cdk from '@aws-cdk/core';
import * as dynamo from '@aws-cdk/aws-dynamodb';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks';
import * as iam from '@aws-cdk/aws-iam';
import * as apigw from '@aws-cdk/aws-apigateway';

export class SfnV2WorkflowStack extends cdk.Stack {
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
    const sfnChildTaskDDBPut = this.sfnDDBTask(table, 'sfnChildTaskDDBPut', '$');

    const map = new sfn.Map(this, 'Map State', {
      maxConcurrency: 10,
      itemsPath: sfn.JsonPath.entirePayload,
    });
    map.iterator(sfnChildTaskDDBPut);

    const sfnChildChain = sfn.Chain.start(map);

    // Child Sfn using Express workflow
    const sfnChild = new sfn.StateMachine(this, 'childSfnExpress', {
      stateMachineType: sfn.StateMachineType.STANDARD,
      definition: sfnChildChain,
      timeout: cdk.Duration.seconds(30),
    });

    const sfnParentTaskDDBPut = this.sfnDDBTask(table, 'sfnParentTaskDDBPut', '$$.Execution.StartTime');

    // Create Task to run Child Sfn
    const sfnChildTask = new tasks.StepFunctionsStartExecution(
      this,
      'sfnChildTask',
      {
        stateMachine: sfnChild,
        integrationPattern: sfn.IntegrationPattern.REQUEST_RESPONSE,
      }
    );

    // Create a parallel task
    const sfnParallel = new sfn.Parallel(this, 'sfnParallel');
    sfnParallel.branch(sfnParentTaskDDBPut);
    sfnParallel.branch(sfnChildTask);

    const sfnParentPassState = new sfn.Pass(this, 'sfnParentPassState');

    const sfnParentChain = sfn.Chain.start(sfnParallel).next(
      sfnParentPassState
    );

    // Parent Sfn using Standard workflow
    const sfnParent = new sfn.StateMachine(this, 'sfnParent', {
      stateMachineType: sfn.StateMachineType.STANDARD,
      definition: sfnParentChain,
      timeout: cdk.Duration.seconds(30),
    });

    table.grantReadWriteData(sfnParent.role);
    table.grantReadWriteData(sfnChild.role);

    // API Gateway
    const roleApiSfn = new iam.Role(this, 'roleApiSfn', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    });

    roleApiSfn.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AWSStepFunctionsFullAccess'
      )
    );
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
  }

  private sfnDDBTask(table: dynamo.Table, id: string, sk: string) {
    return new tasks.DynamoPutItem(this, id, {
      item: {
        pk: tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt('$$.Execution.Id')
        ),
        sk: tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt(sk)
        ),
      },
      table,
    });
  }
}
