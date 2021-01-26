import * as cdk from '@aws-cdk/core';
import * as ddb from '@aws-cdk/aws-dynamodb';
import * as stepfunctions from '@aws-cdk/aws-stepfunctions';

export class DdbQueryStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new ddb.Table(this, 'table', {
      tableName: 'demo',
      partitionKey: {
        name: 'pk',
        type: ddb.AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: ddb.AttributeType.STRING,
      },
      billingMode: ddb.BillingMode.PROVISIONED,
      readCapacity: 100,
      writeCapacity: 100,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const sfnMapParent = new stepfunctions.Map(this, 'sfnMapParent', {
      maxConcurrency: 10,
      itemsPath: stepfunctions.JsonPath.stringAt('$.inputForMap'),
    });
    sfnMapParent.iterator(this.createTask(table.tableName, 1))

    const sfnChildWorkflow = new stepfunctions.StateMachine(
      this,
      'sfnChildWorkflow',
      {
        definition: sfnMapParent,
        timeout: cdk.Duration.seconds(500),
      }
    );

    table.grantReadWriteData(sfnChildWorkflow.role);

  }

  private createTask(tableName: string, index: number) {
    const sfnTaskDDBState = {
      Type: 'Task',
      Resource: 'arn:aws:states:::dynamodb:putItem',
      Parameters: {
        TableName: tableName,
        Item: {
          pk: {
            'S.$':
              "States.Format('clientId{}', $.c)",
          },
          sk: {
            'S.$':
              "States.Format('{}#{}', $$.State.EnteredTime, $.x)",
          },
          clientId: {
            'S.$':
              "States.Format('clientId{}', $.c)",
          },
          date: {
            'S.$': '$$.State.EnteredTime',
          },
          executionId: {
            'S.$': '$$.Execution.Id',
          }
        },
      },
      ResultPath: null,
    };
    return new stepfunctions.CustomState(this, `sfnTaskDDBPut-${index}`, {
      stateJson: sfnTaskDDBState,
    });
  }
}
