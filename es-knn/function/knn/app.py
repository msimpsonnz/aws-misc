import boto3
from requests_aws4auth import AWS4Auth
from elasticsearch import Elasticsearch, RequestsHttpConnection
import pandas as pd
import uuid
import random
import numpy as np

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

def createIndex():
    knn_index = {
        "settings": {
            "index.knn": True
        },
        "mappings": {
            "properties": {
                "knn_vector": {
                    "type": "knn_vector",
                    "dimension": 4
                },
            }
        }
    }
    es.indices.create(index="property",body=knn_index,ignore=400)

def deleteIndex():
    es.indices.delete(index="property")

def importData():
    df = pd.read_csv('prop.csv')
    for index,row in df.iterrows():
        # es.index(index="property",
        #     id=str(uuid.uuid4()),
        #     body = {
        #         "region": row.tolist()[0],
        #         "knn_vector": row.tolist()
        #     })
        vec = []
        vec.append(row.tolist()[1])
        vec.append(row.tolist()[2])
        vec.append(row.tolist()[7])
        vec.append(row.tolist()[8])
        data = {
                "suburb": row.tolist()[0], 
                "pricelow": row.tolist()[1], 
                "pricelhigh": row.tolist()[2],
                "price": row.tolist()[3], 
                "bed": row.tolist()[4], 
                "bath": row.tolist()[5], 
                "sqm": row.tolist()[6], 
                "lat": row.tolist()[7],
                "long": row.tolist()[8],  
                "knn_vector": vec
            }
        print(data)
        try:
            es.index(index="property",
                id=str(uuid.uuid4()),
                body = data)
            print('Added record')
        except:
            print("Unexpected error:", sys.exc_info()[0])

def create_random_point(x0,y0,distance):
    """
            Utility method for simulation of the points
    """   
    r = distance/ 111300
    u = np.random.uniform(0,1)
    v = np.random.uniform(0,1)
    w = r * np.sqrt(u)
    t = 2 * np.pi * v
    x = w * np.cos(t)
    x1 = x / np.cos(y0)
    y = w * np.sin(t)
    return (x0+x1, y0 +y)



def importData():
    latitude1,longitude1 = -36.896852899140384, 174.8112767589163
    priceRange = [1000000, 1200000, 1400000, 1600000]
    bedRange = [3,4]
    bathRange = [1,2]

    for i in range(1,1000):
        x,y = create_random_point(latitude1,longitude1 ,1000 )
        price = random.choice(priceRange)
        priceLow = price - 200000
        priceHigh = price + 200000
        bed = random.choice(bedRange)
        bath = random.choice(bathRange)
        sqm = random.randint(400, 800)
        data = {
            "suburb": 1, 
            "pricelow": priceLow, 
            "pricelhigh": priceHigh,
            "price": price, 
            "bed": bed, 
            "bath": bath, 
            "sqm": sqm, 
            "lat": x,
            "long": y,  
            "knn_vector": [priceLow, priceHigh, x, y]
        }
        try:
            es.index(index="property",
                id=str(uuid.uuid4()),
                body = data)
            print('Added record')
        except:
            print("Unexpected error:", sys.exc_info()[0])



def getKnn(vector):
    body = {
        "size": 3,
        "_source": {
            "exclude": ["knn_vector"]
        },
        "query": {
            "knn": {
                "knn_vector": {
                    "vector": vector,
                    "k": 3
                }
            }
        }
    }
    print(body)
    res = es.search(index="property",
                    body=body)

    print(res)

def top10():
    res = es.search(index="property", body={ "from" : 0, "size" : 10, "query": {"match_all": {}}})
    print(res)
#createIndex()
#importData()
sample = [1200,1600,-36.850,174.850]
getKnn(sample)
#top10()
#deleteIndex()
