import os
import json
import boto3

ENDPOINT_NAME = os.environ['ENDPOINT_NAME']
runtime= boto3.client('runtime.sagemaker')

def invoke_endpoint(payload):
    response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME, ContentType='text/csv', Body=payload)
    return response

def process_req(event):
    data = json.loads(json.dumps(event))
    payload = data['data']
    result = invoke_endpoint(payload)
    print(result)


