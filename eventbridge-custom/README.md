For details see this blog
[Blog](https://msimpson.co.nz/EventBridge-Custom/)

## Prerequisites
* Git
* AWS CDK
* AWS CLI
* pyenv
* boto3
* jq

## To deploy the stack run
```bash
git clone https://github.com/msimpsonnz/aws-misc.git
cd aws-misc/eventbridge-custom/
./deploy/deploy.sh
python client/client.py
```

## To cleanup run
```bash
./deploy/cleanup.sh
```