import os
import json
import boto3

runtime = boto3.client('runtime.sagemaker')
ENDPOINT_NAME = 'linear-endpoint'


# data = json.loads("{\"data\": [0,48,10,30.3116667,-95.4558333,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,1,0]}")
# payload = data[data]
# print(payload)
payload = "22.0, 1.0, 40.8666667, -124.08166670000001, 0.0, 0.0,0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0,0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0"

response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                       ContentType='text/csv',
                                       Body=payload)


print(response)
result = json.loads(response['Body'].read().decode())
print(result)