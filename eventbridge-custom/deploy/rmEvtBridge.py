import boto3
import sys

client = boto3.client('events')

event_buses = client.list_event_buses()
event_bus_name=sys.argv[1]
print(f"EventBus: {event_bus_name}")
response = client.list_rules(EventBusName=event_bus_name)
for rule in response.get('Rules', []):
    name=rule['Name']
    
    targets = client.list_targets_by_rule(Rule=name, EventBusName=event_bus_name)
    print(targets)
    
    for target in targets.get('Targets', []):
        _id=target['Id']
        client.remove_targets(Rule=name, EventBusName=event_bus_name, Ids=[_id])
        print(f"Targets removed for Rule: {name}")
    
    client.delete_rule(Name=name, EventBusName=event_bus_name, Force=True)
    print(f"Deleted Rule: {name}")

    client.delete_event_bus(Name=event_bus_name)
    print(f"Delete EventBus: {event_bus_name}")