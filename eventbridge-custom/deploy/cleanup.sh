#!/bin/bash
cd deploy
evtbridgeBus='evtCustomAuth'
eval "$(pyenv init -)"
pyenv shell 3.6.8
python rmEvtBridge.py $evtbridgeBus

cd ../cdk
cdk destroy --require-approval never