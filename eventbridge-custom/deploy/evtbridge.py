import boto3
import sys      

client = boto3.client('events')

accountId = sys.argv[1]
region = sys.argv[2]
evtbridgeBus = sys.argv[3]
evtbridgeRule = 'customRule'
evtbridgeRulePattern = '{\n  "source": [\n    "login.success"\n  ]\n}'
evtTargetArn = f'arn:aws:firehose:{region}:{accountId}:deliverystream/stream-evtbridge-custom'
evtTargetRoleArn = f'arn:aws:iam::{accountId}:role/demo-evtbridge-firehose-role'

createEB = client.create_event_bus(
    Name=evtbridgeBus,
)
print(createEB)

put_rule = client.put_rule(
    Name=evtbridgeRule,
    EventPattern=evtbridgeRulePattern,
    EventBusName=evtbridgeBus
)
print(put_rule)

createTarget = client.put_targets(
    Rule=evtbridgeRule,
    EventBusName=evtbridgeBus,
    Targets=[
        {
            'Id': 'someTargetId',
            'Arn': evtTargetArn,
            'RoleArn': evtTargetRoleArn
        },
    ]
)
print(createTarget)

list_targets_by_rule = client.list_targets_by_rule(
    Rule=evtbridgeRule,
    EventBusName=evtbridgeBus
)
print(list_targets_by_rule)

describe_rule = client.describe_rule(
    Name=evtbridgeRule,
    EventBusName=evtbridgeBus
)
print(describe_rule)


