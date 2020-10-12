import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import {
  EventBus,
  Rule,
  IRuleTarget,
} from '@aws-cdk/aws-events';

interface EventSendingStackProps extends cdk.StackProps {
  recievingAccountId: string;
}

export class EventSendingStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: EventSendingStackProps) {
    super(scope, id, props);

    const eventBusSending = new EventBus(this, 'eventBusSending', {
      eventBusName: 'mjsdemo-sending',
    });

    const eventBusRuleSending = new Rule(this, 'eventBusRuleSending', {
      eventBus: eventBusSending,
      eventPattern: {
        source: ['event']
      }
    });

    const eventBusRuleSendingRole = new iam.Role(this, "eventBusRuleSendingRole", {
      assumedBy: new iam.ServicePrincipal("events.amazonaws.com"),
    });

    eventBusRuleSendingRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [`arn:aws:events:${cdk.Aws.REGION}:${props.recievingAccountId}:event-bus/mjsdemo-recieving`],
        actions: ["events:PutEvents"],
      })
    );

    eventBusRuleSending.addTarget(
      new AddTargetWithRole(
        "T1",
        `arn:aws:events:${cdk.Aws.REGION}:${props.recievingAccountId}:event-bus/mjsdemo-recieving`,
        eventBusRuleSendingRole
      )
    );
        
  }
}

export class AddTargetWithRole implements IRuleTarget {
  public constructor(
    private readonly id: string,
    private readonly arn: string,
    private readonly role?: iam.IRole,
  ) {}

  public bind() {
    return { id: this.id, arn: this.arn, role: this.role };
  }
}
