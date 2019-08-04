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
        KeyConditionExpression=Key('phoneNumber').eq(callerID)  
    )
    
    # #Check for u'Count' existing with a 1 value within the DynamoDB indicating a blocked record exists
    # if 1 in response.values():         
    #     #Sets Key:Value Pair needed for proper Connect handling
    #     filteredNumberReturn = {'userFound' : 'True'} 
    #     print(A call has been filtered:  {}'.format(callerID))
    # else:
    #     #Sets Key:Value Pair needed for proper Connect handling
    #     filteredNumberReturn = {'userFound' : 'False'}
    
    #Return to Connect our key/value combo    
    return response