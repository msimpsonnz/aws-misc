import os
import json
import uuid
from kafka import KafkaProducer
AWS_KAFKA_TOPIC = os.environ['AWS_KAFKA_TOPIC']
AWS_MSK_BOOTSTRAP = os.environ['AWS_MSK_BOOTSTRAP']


def handler(event, context):
        producer = KafkaProducer(bootstrap_servers=[AWS_MSK_BOOTSTRAP], value_serializer=lambda m: json.dumps(m).encode('ascii'))
        _id = uuid.uuid4()
        producer.send(AWS_KAFKA_TOPIC, {'id': str(_id)})
        producer.flush()
