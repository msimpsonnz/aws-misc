#import the Python packages for Lambda to use
import os
from datetime import datetime
import boto3
from boto3.dynamodb.conditions import Key, Attr
import json
import stripe

ssm_client = boto3.client('ssm')

#start our Lambda runtime here 
def handler(event,context):
    dynamoTable = os.environ['AWS_DYNAMODB']
    #Establish connection to dynamoDB and retrieve table
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(dynamoTable)

    ssm_response = ssm_client.get_parameter(
        Name='StripeApiKey',
        WithDecryption=True
    )

    stripe.api_key = ssm_response['Parameter']['Value']
    
    #KeyConditionExpression looks for number that equals ANI of inbound call from a dynamoDB table and saves it to response
    try:
        #event = stripe.Event.construct_from(
        #json.loads(event), stripe.api_key
        #)
        #print(event)
        #msg = json.dumps(event.body)
        s = event['body']
        print(s)
        i = json.loads(s)
        id = i['id']
        
        now = datetime.now()
        response = table.put_item(
        Item={
                'phoneNumber': id,
                'attrib': f"trans#{datetime.timestamp(now)}",
                'stripe': i
            }
        )
        return {
            "statusCode": 200,
            "body": ""
        }
    
    except ValueError as e:
        # Invalid payload
        print(e)
        return {
            "statusCode": 400,
            "body": ""
        }
 