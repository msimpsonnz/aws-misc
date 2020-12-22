import sys
import os

# Setting library paths.
efs_path = "/mnt/msg/python"
python_pkg_path = os.path.join(efs_path, "xgboost/lib/python3.7/site-packages")
sys.path.append(python_pkg_path)

import json
import pickle as pkl
import xgboost
import numpy as np


def handler(event, context):
    #Load Model
    model_file_path ="/mnt/msg/model/xgboost-model"
    model = pkl.load(open(model_file_path, 'rb'))

    #Load file
    inputFileName = f"/mnt/msg/input/{event['id']}.csv"
    #arr = np.loadtxt(inputFileName, delimiter=',')
    with open(inputFileName) as f:
        json_data = json.load(f)
    arrPredict = np.array([json_data])
    xgPredict = xgboost.DMatrix(arrPredict)
    pred = model.predict(xgPredict)
    print(pred)
    result = {}
    result['predict'] = pred.tolist()
    outputFileName = f"/mnt/msg/output/{event['id']}.json"
    with open(outputFileName, 'w') as outfile:
        json.dump(result, outfile)
    return