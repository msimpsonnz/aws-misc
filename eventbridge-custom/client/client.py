import boto3
import json
import random
from enum import Enum

client = boto3.client('events')

while(True):
    event = random.choice(['success', 'failed', 'refresh'])
    print(event)

    data = {
        "customEvent": {
            "loginEvent": event
        }
    }
    json_string = json.dumps(data)
    print(json_string)

    source = f'login.{event}'
    print(source)

    putEvent = client.put_events(
        Entries=[
            {
                'Source': source,
                'DetailType': 'string',
                'Detail': json_string,
                'EventBusName': 'evtCustomAuth'
            },
        ]
    )
    print(putEvent)