import boto3
import json

client = boto3.client('events')

data = {
    "customEvent": {
        "logon": "Successful"
    }
}
json_string = json.dumps(data)

putEvent = client.put_events(
    Entries=[
        {
            'Source': 'mjs.login',
            'DetailType': 'string',
            'Detail': json_string,
            'EventBusName': 'mjseventbus'
        },
    ]
)

print(putEvent)