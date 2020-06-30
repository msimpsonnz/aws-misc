import json
from flask import Flask
from flask import request
from concurrent.futures import Future
from awscrt import io
from awscrt.io import LogLevel
from awscrt.mqtt import Connection, Client, QoS
from awsiot.greengrass_discovery import DiscoveryClient, DiscoverResponse
from awsiot import mqtt_connection_builder

root_ca_path = '/app/certs/root.ca.pem'
certificate_path = '/app/certs/709da90f0c.cert.pem'
private_key_path = '/app/certs/709da90f0c.private.key'
thing_name = 'docker_local'

io.init_logging(1, 'stderr')

event_loop_group = io.EventLoopGroup(1)
host_resolver = io.DefaultHostResolver(event_loop_group)
client_bootstrap = io.ClientBootstrap(event_loop_group, host_resolver)

tls_options = io.TlsContextOptions.create_client_with_mtls_from_path(certificate_path, private_key_path)
if root_ca_path:
    tls_options.override_default_trust_store_from_path(None, root_ca_path)
tls_context = io.ClientTlsContext(tls_options)

socket_options = io.SocketOptions()
socket_options.connect_timeout_ms = 3000

print('Performing greengrass discovery...')
discovery_client = DiscoveryClient(client_bootstrap, socket_options, tls_context, 'ap-southeast-2')
resp_future = discovery_client.discover(thing_name)
discover_response = resp_future.result()

print(discover_response)


def on_connection_interupted(connection, error, **kwargs):
    print('connection interrupted with error {}'.format(error))


def on_connection_resumed(connection, return_code, session_present, **kwargs):
    print('connection resumed with return code {}, session present {}'.format(return_code, session_present))

# Try IoT endpoints until we find one that works
def try_iot_endpoints():
    for gg_group in discover_response.gg_groups:
        for gg_core in gg_group.cores:
            for connectivity_info in gg_core.connectivity:
                try:
                    print('Trying core {} at host {} port {}'.format(gg_core.thing_arn, connectivity_info.host_address, connectivity_info.port))
                    mqtt_connection = mqtt_connection_builder.mtls_from_path(
                        endpoint=connectivity_info.host_address,
                        port=connectivity_info.port,
                        cert_filepath=certificate_path,
                        pri_key_filepath=private_key_path,
                        client_bootstrap=client_bootstrap,
                        ca_bytes=gg_group.certificate_authorities[0].encode('utf-8'),
                        on_connection_interrupted=on_connection_interupted,
                        on_connection_resumed=on_connection_resumed,
                        client_id=thing_name,
                        clean_session=False,
                        keep_alive_secs=6)
                    
                    connect_future = mqtt_connection.connect()
                    connect_future.result()
                    print('Connected!')

                    return mqtt_connection

                except Exception as e:
                    print('Connection failed with exception {}'.format(e))
                    continue

    exit('All connection attempts failed')

mqtt_connection = try_iot_endpoints()


app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello, World!"

@app.route("/action")
def status():
    action = request.args.get('action')
    print(action)
    topic = request.args.get('topic')
    print(topic)
    message = {}
    message['action'] = action
    messageJson = json.dumps(message)
    pub_future, _ = mqtt_connection.publish(topic, messageJson, QoS.AT_MOST_ONCE)
    pub_future.result()
    print('Published topic {}: {}\n'.format(topic, messageJson))
    return {'action': action, 'topic': topic}

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')