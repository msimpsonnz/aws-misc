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
            print('Remove: Stop Unicorn')
            os.remove('/src/on.txt')
            os.system("pkill -f /src/app.py && /usr/bin/python3 -c 'import unicornhat as unicorn;unicorn.clear();unicorn.off()'")
        elif event['action'] == 'StopCall':
            print('StopCall: Stop Unicorn')
            os.remove('/src/on.txt')
            os.system("pkill -f /src/app.py && /usr/bin/python3 -c 'import unicornhat as unicorn;unicorn.clear();unicorn.off()'")
        elif event['action'] == 'Configure':
            print('Configure: Start Unicorn')
            with open('/src/on.txt', 'w') as outfile:
                json.dump(True, outfile)
            os.system("/usr/bin/python3 /src/app.py 0 255 0 &")
        elif event['action'] == 'kCameraStreamStart':
            print('Start Camera')
            # Write the new value in case the process is running
            if os.path.isfile('/src/on.txt'):
                write_rgb(255,0,0)
            else:
                # Run the script in case no using bluetooth headphones
                with open('/src/on.txt', 'w') as outfile:
                    json.dump(True, outfile)
                os.system("/usr/bin/python3 /src/app.py 255 0 0 &")
        elif event['action'] == 'kCameraStreamStop':
            print('Stop Camera')
            write_rgb(255,126,0)
        elif event['action'] == 'StartCall':
            print('StartCall')
            # Write the new value in case the process is running
            if os.path.isfile('/src/on.txt'):
                write_rgb(255,126,0)
            else:
                # Run the script in case no using bluetooth headphones
                with open('/src/on.txt', 'w') as outfile:
                    json.dump(True, outfile)
                os.system("/usr/bin/python3 /src/app.py 255 126 0 &")
        else:
            print('Error Unknow Action')
            
        msg = json.dumps(event)
        response = 'Invoked on topic "%s" with message "%s"' % (input_topic, msg)
        logging.info(response)
        client.publish(topic=OUTPUT_TOPIC, payload=msg)
    
    except Exception as e:
        logging.error(e)
    
    return


def write_rgb(r_value = 255, g_value = 0, b_value = 0):
    data = {
        'r': r_value,
        'g': g_value,
        'b': b_value,
    }

    with open('/src/rgb.json', 'w') as outfile:
        json.dump(data, outfile)