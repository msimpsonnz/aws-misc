#import the Python packages for Lambda to use
import os
import boto3
from boto3.dynamodb.conditions import Key, Attr
import stripe

client = boto3.client('ssm')

#start our Lambda runtime here 
def handler(event,context):
    
    #Retrieve ANI from inbound callerID
    callerID = event["Details"]["ContactData"]["CustomerEndpoint"]["Address"]
    #Retrieve Ammount
    amountFloat = float(event["Details"]["Parameters"]["Amount"])
    print(f"Amount: {amount}")
    
    dynamoTable = os.environ['AWS_DYNAMODB']
    #Establish connection to dynamoDB and retrieve table
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(dynamoTable)
    
    #KeyConditionExpression looks for number that equals ANI of inbound call from a dynamoDB table and saves it to response
    response = table.get_item(
        Key={'phoneNumber': callerID, 'attrib': 'user'}
    )
    
    customer = stripe.Customer.retrieve(response['Item']['stripeId'])

    ssm_response = client.get_parameter(
        Name='StripeApiKey',
        WithDecryption=True
    )

    stripe.api_key = ssm_response['Parameter']['Value']

    charge = stripe.Charge.create(
        amount=amount,
        currency="nzd",
        customer=customer['id'],
        source=customer['sources']['data'][0]['id'],
        description=f"Charge for {customer['phone']}"
    )

    status = {'status': charge['status']}
    print(status)
    #Return to Connect our key/value combo    
    return status