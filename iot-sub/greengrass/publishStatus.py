import os
import greengrasssdk
import logging
import json

client = greengrasssdk.client('iot-data')

OUTPUT_TOPIC = 'status/status_msg'

def get_input_topic(context):
    try:
        topic = context.client_context.custom['subject']
    except Exception as e:
        logging.error('Topic could not be parsed. ' + repr(e))
    return topic

def function_handler(event, context):
    try:
        logging.info(json.dumps(event))
        input_topic = get_input_topic(context)
        if event['action'] == 'Remove':
            print('Stop Unicorn')
            os.system("pkill -f /src/app.py && /usr/bin/python3 -c 'import unicornhat as unicorn;unicorn.clear();unicorn.off()'")
        if event['action'] == 'Created':
            print('Start Unicorn')
            os.system("/usr/bin/python3 /src/app.py &")
        msg = json.dumps(event)
        response = 'Invoked on topic "%s" with message "%s"' % (input_topic, msg)
        logging.info(response)
    except Exception as e:
        logging.error(e)

    client.publish(topic=OUTPUT_TOPIC, payload=msg)

    return