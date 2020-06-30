import greengrasssdk
import logging
import json

client = greengrasssdk.client('iot-data')

OUTPUT_TOPIC = 'status/local'

def get_input_topic(context):
    try:
        topic = context.client_context.custom['subject']
    except Exception as e:
        logging.error('Topic could not be parsed. ' + repr(e))
    return topic

def function_handler(event, context):
    try:
        input_topic = get_input_topic(context)
        msg = json.dumps(event)
        response = 'Invoked on topic "%s" with message "%s"' % (input_topic, msg)
        logging.info(response)
    except Exception as e:
        logging.error(e)

    client.publish(topic=OUTPUT_TOPIC, payload=msg)

    return