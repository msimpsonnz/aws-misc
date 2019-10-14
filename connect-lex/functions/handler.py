import json
import os
import boto3

client = boto3.client('connect', region_name='ap-southeast-2')

def lambda_handler(event, context):
    print(event['DestinationPhoneNumber'])
    client.start_outbound_voice_contact(
        DestinationPhoneNumber=event['DestinationPhoneNumber'],
        ContactFlowId=os.environ['ContactFlowId'],
        InstanceId=os.environ['InstanceId'],
        QueueId=os.environ['QueueId']
    )
    return {
        'statusCode': 200,
        'body': json.dumps('Ok')
    }
