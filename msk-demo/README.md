export ClusterArn=arn:aws:kafka:ap-southeast-2:383358879677:cluster/msk-demo/28392fe6-dd81-472d-a9f6-0276428fc374-3
export AWS_REGION=ap-southeast-2
aws kafka describe-cluster --region $AWS_REGION --cluster-arn $ClusterArn


aws kafka get-bootstrap-brokers --cluster-arn $ClusterArn

sudo yum install java-1.8.0
wget https://archive.apache.org/dist/kafka/2.2.1/kafka_2.12-2.2.1.tgz
tar -xzf kafka_2.12-2.2.1.tgz


export ZookeeperConnectString="z-2.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:2181,z-3.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:2181,z-1.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:2181"

bin/kafka-topics.sh --create --zookeeper $ZookeeperConnectString --replication-factor 2 --partitions 1 --topic users

bin/kafka-topics.sh --create --zookeeper $ZookeeperConnectString --replication-factor 1 --partitions 1 --topic pageviews


curl -X POST \
     -H "Content-Type: application/vnd.kafka.json.v2+json" \
     -H "Accept: application/vnd.kafka.v2+json" \
     --data '{"records":[{"key":"alice","value":{"count":0}},{"key":"alice","value":{"count":1}},{"key":"alice","value":{"count":2}}]}' \
     "http://mskde-lb8a1-1qffkrr9uebx3-269059521.ap-southeast-2.elb.amazonaws.com:8082/topics/AWSKafkaTutorialTopic"


export CONFLUENT_HOME=/home/ec2-user/confluent/confluent-6.0.0
export PATH=$PATH:$CONFLUENT_HOME/bin
$CONFLUENT_HOME/bin/ksql-datagen quickstart=pageviews format=delimited topic=pageviews msgRate=5 bootstrap-server=b-2.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092
$CONFLUENT_HOME/bin/ksql-datagen quickstart=users format=json topic=users msgRate=1 bootstrap-server=b-2.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092

export CONFLUENT_HOME=/home/ec2-user/confluent/confluent-6.0.0
$CONFLUENT_HOME/bin/ksql http://172.16.2.31:8088