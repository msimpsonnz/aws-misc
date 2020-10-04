import * as cdk from '@aws-cdk/core';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks';
import * as dynamo from '@aws-cdk/aws-dynamodb';
import * as events from '@aws-cdk/aws-events';
import * as targets from '@aws-cdk/aws-events-targets';
import * as iam from '@aws-cdk/aws-iam';
import * as apigw from '@aws-cdk/aws-apigateway';

export class SfnWorkflowStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //#########################################################//
    // Create Step Function
    //#########################################################//

    // Create State Machine Workflow, see contruct at end
    const sfnStateMachineWorker1 = this.CreateSfnStateMachineWorker('sfnStateMachineWorker1');
    const sfnStateMachineWorker2 = this.CreateSfnStateMachineWorker('sfnStateMachineWorker2');
    
    //#########################################################//
    // Create Step Function History Capture
    //#########################################################//

    // Create DDB table for Event History
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

    const sfnTaskDDBState = {
      Type: 'Task',
      Resource: 'arn:aws:states:::dynamodb:putItem',
      Parameters: {
        TableName: `${table.tableName}`,
        Item: {
          pk: {
            'S.$': '$.detail.name',
          },
          sk: {
            'S.$': "States.Format('{}#{}', $.detail.executionArn, $.detail.status)",
          },
          status: {
            'S.$': '$.detail.status',
          },
        },
      },
      ResultPath: null,
    };


    // const sfnTaskDDBPut = new tasks.DynamoPutItem(this, 'sfnTaskDDBPut', {
    //   item: {
    //     pk: tasks.DynamoAttributeValue.fromString(
    //       sfn.JsonPath.stringAt('$.detail.name')
    //     ),
    //     sk: tasks.DynamoAttributeValue.fromString(
    //       sfn.JsonPath.stringAt('$.pk')
    //     ),
    //     status: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.detail.status')),
    //   },
    //   table,
    // });
    const sfnTaskDDBPut = new sfn.CustomState(this, 'sfnTaskDDBPut', {
      stateJson: sfnTaskDDBState,
    });

    // Create a StateMachine to process EventBridge and store them in DDB
    const sfnStateMachineHistory = new sfn.StateMachine(
      this,
      'sfnStateMachine',
      {
        definition: sfnTaskDDBPut,
        timeout: cdk.Duration.seconds(30),
      }
    );
    table.grantReadWriteData(sfnStateMachineHistory.role);

    // Create EventBrige Rule for Step Function Events
    const ruleSfnEvents = new events.Rule(this, 'ruleSfnEvents', {
      eventPattern: {
        source: ['aws.states'],
        detailType: ['Step Functions Execution Status Change'],
        // detail: {
        //   status: ['SUCCEEDED']
        // },
        resources: [ 
          {
            "prefix": `arn:aws:states:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:execution:sfnStateMachineWorker`
          }
        ] as any[],
      },
    });

    ruleSfnEvents.addTarget(
      new targets.SfnStateMachine(sfnStateMachineHistory)
    );

    //#########################################################//
    // Create API Gateway
    //#########################################################//

    // API Gateway
    const api = new apigw.RestApi(this, 'api', {
      restApiName: this.stackId,
    });

    const roleApiSfn = new iam.Role(this, 'roleApiSfn', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    });

    roleApiSfn.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AWSStepFunctionsFullAccess')
    );
    const workflowAPI = api.root.addResource('workflow');
    const workflowExecution = workflowAPI.addResource('execution');
    const workflowExecutionName = workflowExecution.addResource('{name}');

    const sfnIntegration = new apigw.AwsIntegration({
      service: 'states',
      action: 'StartExecution',
      options: {
        credentialsRole: roleApiSfn,
        requestTemplates: {
          'application/json': JSON.stringify({
            input: "$util.escapeJavaScript($input.path('$.input'))",
            name: "$input.path('$.name')",
            stateMachineArn: `arn:aws:states:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:stateMachine:$util.escapeJavaScript($input.params('name'))`,
          }),
        },
        integrationResponses: [
          {
            statusCode: '200',
          },
        ],
      },
    });

    workflowExecutionName.addMethod('POST', sfnIntegration, {
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
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
    );

    const ddbIntegration = new apigw.AwsIntegration({
      service: 'dynamodb',
      action: 'Query',
      options: {
        credentialsRole: roleApiDdb,
        requestParameters: {
          "integration.request.querystring.id": 'method.request.querystring.id'
        },
        passthroughBehavior: apigw.PassthroughBehavior.NEVER,
        requestTemplates: {
          'application/json': JSON.stringify({
            TableName: table.tableName,
            KeyConditionExpression: "pk = :pk and begins_with(sk, :sk)",
            ExpressionAttributeValues: {
              ":pk": {
                "S": "$input.params('id')"
              },
              ":sk": {
                "S": `arn:aws:states:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:execution:$util.escapeJavaScript($input.params('name'))#`
              }
            }
          }),
        },
        integrationResponses: [
          {
            statusCode: '200',
          },
        ],
      },
    });

    const workflowHistory = workflowAPI.addResource('history');
    const workflowHistoryName = workflowHistory.addResource('{name}');

    workflowHistoryName.addMethod('GET', ddbIntegration, {
      requestParameters: {
        'method.request.querystring.id': true
      },
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
  

  private CreateSfnStateMachineWorker(name: string) {
    
    // Create a Pass State just for testing
    const sfnPass = new sfn.Pass(this, `sfnPass-${name}`);

    // Sfn create State Machine using Standard workflow
    const sfnStateMachineWorker = new sfn.StateMachine(
      this,
      name,
      {
        stateMachineName: name,
        definition: sfnPass,
        timeout: cdk.Duration.seconds(30),
      }
    );
    return sfnStateMachineWorker;
  }
}
