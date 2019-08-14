#import the Python packages for Lambda to use
import os
import boto3
from boto3.dynamodb.conditions import Key, Attr

#start our Lambda runtime here 
def handler(event,context):
    
    #Retrieve ANI from inbound callerID
    callerID = event["Details"]["ContactData"]["CustomerEndpoint"]["Address"]
    
    dynamoTable = os.environ['AWS_DYNAMODB']
    #Establish connection to dynamoDB and retrieve table
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(dynamoTable)
    
    #KeyConditionExpression looks for number that equals ANI of inbound call from a dynamoDB table and saves it to response
    response = table.get_item(
        Key={'phoneNumber': callerID, 'attrib': 'user'}
    )
    
    try:
        #Sets Key:Value Pair needed for proper Connect handling
        filteredNumberReturn = {'userFound' : 'True', 'userName' : response['Item']['firstName'], 'currentBalance' : response['Item']['currentBalance']} 
        print(f"A call has been filtered:  {callerID}")
    except:
        filteredNumberReturn = {'userFound' : 'False'} 
        print(f"User not found")
    
    #Return to Connect our key/value combo    
    return filteredNumberReturn