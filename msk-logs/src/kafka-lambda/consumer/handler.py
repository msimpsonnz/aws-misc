import os
import uuid
import boto3
import json
import datetime
import requests
from requests_aws4auth import AWS4Auth
from kafka import KafkaConsumer, KafkaProducer
AWS_REGION = os.environ['AWS_REGION']
AWS_KAFKA_TOPIC = os.environ['AWS_KAFKA_TOPIC']
AWS_MSK_BOOTSTRAP = os.environ['AWS_MSK_BOOTSTRAP']
AWS_ES_DOMAIN = os.environ['AWS_ES_DOMAIN']

region = AWS_REGION
service = 'es'
credentials = boto3.Session().get_credentials()
awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, region, service, session_token=credentials.token)

host = f"https://{AWS_ES_DOMAIN}"
index = 'lambda-msk-index'
type = 'lambda-msk-type'
url = host + '/' + index + '/' + type + '/'
headers = { "Content-Type": "application/json" }

def handler(event, context):
        count = 0
        timestamp = datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%f")
        consumer = KafkaConsumer(AWS_KAFKA_TOPIC, group_id='lambda', consumer_timeout_ms=10000, bootstrap_servers=[AWS_MSK_BOOTSTRAP], value_deserializer=lambda m: json.loads(m.decode('ascii')))
        for message in consumer:
                # message value and key are raw bytes -- decode if necessary!
                # e.g., for unicode: `message.value.decode('utf-8')`
                print ("%s:%d:%d: key=%s value=%s" % (message.topic, message.partition,
                                                        message.offset, message.key,
                                                        message.value))
                _id = uuid.uuid4()
                # Create the JSON document
                document = { "id": str(id), "timestamp": str(timestamp), "message": message.value }
                # Index the document
                r = requests.put(url + str(id), auth=awsauth, json=document, headers=headers)
                print(f"statusCode: {r.status_code}, message:{r.text}")
                count += 1
        return 'Processed ' + str(count) + ' items.'