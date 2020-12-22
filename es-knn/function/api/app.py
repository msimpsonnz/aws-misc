import json
import boto3
from requests_aws4auth import AWS4Auth
from elasticsearch import Elasticsearch, RequestsHttpConnection

region = 'ap-southeast-2'
service = 'es'
es_host = 'search-esknnst-esdoma-1nq28qan72a3h-7t4yw47zxg73iw6vszpiabhlbq.ap-southeast-2.es.amazonaws.com'
credentials = boto3.Session().get_credentials()
awsauth = AWS4Auth(credentials.access_key, credentials.secret_key,
                   region, service, session_token=credentials.token)

es = Elasticsearch(
    hosts=[{'host': es_host, 'port': 443}],
    http_auth=awsauth,
    use_ssl=True,
    verify_certs=True,
    connection_class=RequestsHttpConnection
)

def handler(event, context):
    #print("Received event: " + json.dumps(event, indent=2))
    if event['httpMethod'] == 'GET':
        res = es.search(index="property", body={ "from" : 0, "size" : 10, "query": {"match_all": {}}})
        print(res)
        return {
            'statusCode': 200,
            'headers': {
                "Access-Control-Allow-Origin": "*",
                # "Access-Control-Allow-Headers": "Content-Type",
                # "Access-Control-Allow-Methods": "OPTIONS,GET,POST"
            },
            'body': json.dumps(res['hits'])
        }
    else:
        vec = json.loads(event['body'])
        print(vec)
        vector = json.loads(vec['params'])
        body = {
            "size": 5,
            # "_source": {
            #     "exclude": ["knn_vector"]
            # },
            "query": {
                "knn": {
                    "knn_vector": {
                        "vector": vector,
                        "k": 5
                    }
                }
            }
        }
        print(body)
        res = es.search(index="property",
                        body=body)

        print(res)
        return {
            'statusCode': 200,
            'headers': {
                "Access-Control-Allow-Origin": "*",
                # "Access-Control-Allow-Headers": "Content-Type",
                # "Access-Control-Allow-Methods": "OPTIONS,GET,POST"
            },
            'body': json.dumps(res['hits'])
        }