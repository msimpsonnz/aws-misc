import pandas as pd
import requests
import json

itt = 15
url = 'https://1a74uxucg5.execute-api.ap-southeast-2.amazonaws.com/events'

df = pd.read_csv('./test.csv')
df_test = df.head(itt)
df_list = df_test.values.tolist()
data = df_list


for row in data:
    req = {}
    req['event_type'] = 'predict'
    req['payload'] = str(row)
    print(req)
    req = requests.post(url,json = req)
    res = req.json()
    print(res)
