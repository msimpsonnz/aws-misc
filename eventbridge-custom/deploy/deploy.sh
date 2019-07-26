#!/bin/bash
cd cdk
cdk deploy --require-approval never
accountId=$(aws sts get-caller-identity|jq -r ".Account")
region='us-east-1'
evtbridgeBus='evtCustomAuth'


cd ../deploy
eval "$(pyenv init -)"
pyenv shell 3.6.8
python evtbridge.py $accountId $region $evtbridgeBus