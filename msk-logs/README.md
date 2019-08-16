This is a solution to deploy the following:
* AWS MSK
* AWS EKS
* AWS ElasticSearch
* Aurora RDS

This will be the basis to build a log solution that streams via Kafka to Elastic
* Producer - container running in EKS sending log data to MSK
* MSK Cluster - Kafka cluster
* Consumer - container running on EKS consuming MSK and sending to Elastic
* ElasticSearch - ElasticSearch cluster
* Grafana - container running in EKS to display dashboards from Elastic, internal DB on Aurora
* Aurora - DB for running the Grafana DB

Prerequisites
You will need the following installed
* git
* AWS CLI
* AWS CDK
* docker
* jq


ElasticSearch requires a ServiceLinked role, this is only needed for new accounts but as it is not stack specific CDK/CFN deployment is not recommend so needs to be run using the following CLI command:
```
aws iam create-service-linked-role --aws-service-name es.amazonaws.com
```

### Build the Docker Images
```bash
#Clone the repo
git clone https://github.com/msimpsonnz/aws-misc
#Setup some env variables
export CDK_AWS_REGION=ap-southeast-2
export CDK_AWS_ACCOUNT=$(aws sts get-caller-identity | jq -r .Account)
#Build Infra with CDK
cd msk-logs/cdk
cdk deploy

#Setup up our MSK environment
cd ..
export AWS_KAFKA_TOPIC=AWSKafkaTutorialTopic
export AWS_MSK_CLUSTER=$(aws cloudformation describe-stack-resources --stack-name msk-demo-stack | jq -r '.StackResources[] | select(.ResourceType == "AWS::MSK::Cluster") | .PhysicalResourceId')
echo $AWS_MSK_CLUSTER
export AWS_MSK_CLUSTER_CONNECTSTRING=$(aws kafka describe-cluster --region $CDK_AWS_REGION --cluster-arn $AWS_MSK_CLUSTER | jq -r ".ClusterInfo.ZookeeperConnectString")
#If you get an error here make sure the cluster is "ACTIVE"
echo $AWS_MSK_CLUSTER_CONNECTSTRING

#bin/kafka-topics.sh --create --zookeeper $AWS_MSK_CLUSTER_CONNECTSTRING --replication-factor 3 --partitions 1 --topic AWSKafkaTutorialTopic

export AWS_MSK_BOOTSTRAP=$(aws kafka get-bootstrap-brokers --region $CDK_AWS_REGION --cluster-arn $AWS_MSK_CLUSTER | jq -r .BootstrapBrokerString)
echo $AWS_MSK_BOOTSTRAP


#Get EKS Config
aws eks --region $CDK_AWS_REGION update-kubeconfig --name msk-EKSCluster --profile default

export CDK_AWS_REGION=ap-southeast-2
export CDK_AWS_ACCOUNT=$(aws sts get-caller-identity | jq -r .Account)
export ASSUME_ROLE=$(aws sts assume-role --role-arn arn:aws:iam::$CDK_AWS_ACCOUNT:role/msk-demo-stack-AdminRole38563C57-1PGU4XTWJAHY6 --role-session-name AWSCLI-Session)

export AWS_ACCESS_KEY_ID=$(echo $ASSUME_ROLE | jq -r .Credentials.AccessKeyId)
export AWS_SESSION_TOKEN=$(echo $ASSUME_ROLE | jq -r .Credentials.SessionToken)
export AWS_SECRET_ACCESS_KEY=$(echo $ASSUME_ROLE | jq -r .Credentials.SecretAccessKey)
aws sts get-caller-identity

kubectl apply -f ./src/eks/rbac.yaml

kubectl create namespace grafana
helm install stable/grafana \
    --name gf-release \
    --namespace grafana \
    --set persistence.storageClassName="gp2" \
    --set adminPassword="EKSsAWSome" \
    --set service.type=LoadBalancer

```

```bash
#Docker if required
#Build the base image
$(aws ecr get-login --no-include-email --region $CDK_AWS_REGION)

cd ../src/kafka-base
curl https://archive.apache.org/dist/kafka/2.2.1/kafka_2.12-2.2.1.tgz -o ./bin/kafka_2.12-2.2.1.tgz
docker build -t kafka-base .
aws ecr create-repository --repository-name kafka-base

docker tag kafka-base:latest $CDK_AWS_ACCOUNT.dkr.ecr.$CDK_AWS_REGION.amazonaws.com/kafka-base:latest
docker push $CDK_AWS_ACCOUNT.dkr.ecr.$CDK_AWS_REGION.amazonaws.com/kafka-base:latest
```