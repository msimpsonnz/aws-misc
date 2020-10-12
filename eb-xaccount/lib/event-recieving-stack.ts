import * as cdk from '@aws-cdk/core';
import { EventBus, CfnEventBusPolicy, Rule } from '@aws-cdk/aws-events';
import * as targets from '@aws-cdk/aws-events-targets';
import * as lambda from '@aws-cdk/aws-lambda';

interface EventRecievingStackProps extends cdk.StackProps {
  sendingAccountId: string;
}

export class EventRecievingStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: EventRecievingStackProps) {
    super(scope, id, props);

    const eventBusRecieving = new EventBus(this, 'eventBusRecieving', {
      eventBusName: 'mjsdemo-recieving',
    });

    const eventBusPolicyRecieving = new CfnEventBusPolicy(this, 'eventBusPolicyRecieving', {
      action: 'events:PutEvents',
      statementId: 'statementId',
      principal: props.sendingAccountId,
      eventBusName: eventBusRecieving.eventBusName
    });

    const fnEventLogger = new lambda.Function(this, 'fnEventLogger', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async function(event) { 
          console.log(JSON.stringify(event));
        }
      `),
    });

    const eventBusRuleRecieving = new Rule(
      this,
      "eventBusRuleRecieving",
      {
        eventBus: eventBusRecieving,
        eventPattern: {
          detailType: [ 
            {
              "anything-but": `1111`
            }
          ] as any[],
        },
      }
    );

    eventBusRuleRecieving.addTarget(new targets.LambdaFunction(fnEventLogger))
  
  }
}
