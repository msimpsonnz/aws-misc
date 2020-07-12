import os
import json
import numpy as np
import boto3
from joblib import load

clf = load('/app/model.joblib')
client = boto3.client('sqs', region_name=os.environ['AWS_DEFAULT_REGION'])


response = client.receive_message(QueueUrl=os.environ['AWS_SQS_QUEUE_URL'])

for message in response:
    arr = np.array([message['body']])
    res = clf.predict(arr)
    print(res)