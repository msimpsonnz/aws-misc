import os
from kafka import KafkaConsumer, KafkaProducer
AWS_KAFKA_TYPE = os.environ['AWS_KAFKA_TYPE']
AWS_KAFKA_TOPIC = os.environ['AWS_KAFKA_TOPIC']
AWS_MSK_BOOTSTRAP = os.environ['AWS_MSK_BOOTSTRAP']


def handler(event, context):
        if AWS_KAFKA_TYPE == 'CONSUMER':
                consumer = KafkaConsumer(
                    AWS_KAFKA_TOPIC, bootstrap_servers=AWS_MSK_BOOTSTRAP)
                for msg in consumer:
                        print(msg)
        elif AWS_KAFKA_TYPE == 'PRODUCER':
                producer = KafkaProducer(bootstrap_servers=AWS_MSK_BOOTSTRAP)
                for _ in range(100):
                        producer.send(AWS_KAFKA_TOPIC, b'some_message_bytes')
