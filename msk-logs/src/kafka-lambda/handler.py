import os
import ssl
from kafka import KafkaConsumer, KafkaProducer
AWS_KAFKA_TYPE = os.environ['AWS_KAFKA_TYPE']
AWS_KAFKA_TOPIC = os.environ['AWS_KAFKA_TOPIC']
AWS_MSK_BOOTSTRAP = os.environ['AWS_MSK_BOOTSTRAP']




def handler(event, context):

        context = ssl.create_default_context()
        context.options &= ssl.OP_NO_TLSv1
        context.options &= ssl.OP_NO_TLSv1_1
        context.load_verify_locations(cafile=/secure/cacerts)
        context.check_hostname = False


        if AWS_KAFKA_TYPE == 'CONSUMER':
                consumer = KafkaConsumer(
                    AWS_KAFKA_TOPIC, bootstrap_servers=AWS_MSK_BOOTSTRAP)
                for msg in consumer:
                        print(msg)
        elif AWS_KAFKA_TYPE == 'PRODUCER':
                producer = KafkaProducer(security_protocol='SASL_SSL', ssl_context=context, bootstrap_servers=AWS_MSK_BOOTSTRAP)
                for _ in range(100):
                        producer.send(AWS_KAFKA_TOPIC, b'some_message_bytes')
