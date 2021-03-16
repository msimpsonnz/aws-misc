export ClusterArn=arn:aws:kafka:ap-southeast-2:383358879677:cluster/msk-demo/aa2538a1-986e-486b-9aba-86b1f061798e-3
export AWS_REGION=ap-southeast-2
aws kafka describe-cluster --region $AWS_REGION --cluster-arn $ClusterArn


aws kafka get-bootstrap-brokers --cluster-arn $ClusterArn
export Bootstrap=b-3.msk-demo.r6qmch.c3.kafka.ap-southeast-2.amazonaws.com:9092,b-4.msk-demo.r6qmch.c3.kafka.ap-southeast-2.amazonaws.com:9092,b-1.msk-demo.r6qmch.c3.kafka.ap-southeast-2.amazonaws.com:9092

sudo yum install java-1.8.0
sudo alternatives --config java
sudo yum remove java-1.7.0-openjdk-devel
wget https://archive.apache.org/dist/kafka/2.2.1/kafka_2.12-2.2.1.tgz
tar -xzf kafka_2.12-2.2.1.tgz

curl -O http://packages.confluent.io/archive/6.1/confluent-community-6.1.0.tar.gz
tar -xzf confluent-community-6.1.0.tar.gz

### V2 Cluster

export ZookeeperConnectString="z-2.msk-demo.r6qmch.c3.kafka.ap-southeast-2.amazonaws.com:2181,z-1.msk-demo.r6qmch.c3.kafka.ap-southeast-2.amazonaws.com:2181,z-3.msk-demo.r6qmch.c3.kafka.ap-southeast-2.amazonaws.com:2181"

bin/kafka-topics.sh --create --zookeeper $ZookeeperConnectString --replication-factor 2 --partitions 1 --topic users

bin/kafka-topics.sh --delete --zookeeper $ZookeeperConnectString --topic users

bin/kafka-topics.sh --create --zookeeper $ZookeeperConnectString --replication-factor 1 --partitions 1 --topic pageviews

bin/kafka-topics.sh --list --zookeeper $ZookeeperConnectString 
bin/kafka-topics.sh --create --zookeeper $ZookeeperConnectString --replication-factor 3 --partitions 1 --topic AWSKafkaTutorialTopic
bin/kafka-console-consumer.sh --topic AWSKafkaTutorialTopic --from-beginning --bootstrap-server $Bootstrap
bin/kafka-topics.sh --delete --zookeeper $ZookeeperConnectString --topic AWSKafkaTutorialTopic


curl -X POST \
     -H "Content-Type: application/vnd.kafka.json.v2+json" \
     -H "Accept: application/vnd.kafka.v2+json" \
     --data '{"records":[{"key":"alice","value":{"count":0}},{"key":"alice","value":{"count":1}},{"key":"alice","value":{"count":2}}]}' \
     "http://MskDe-LB8A1-1AS983JAN5YNM-1919033185.ap-southeast-2.elb.amazonaws.com8082/topics/AWSKafkaTutorialTopic"


export CONFLUENT_HOME=/home/ec2-user/environment/confluent-6.1.0
export PATH=$PATH:$CONFLUENT_HOME/bin
$CONFLUENT_HOME/bin/ksql-datagen quickstart=pageviews format=delimited topic=pageviews msgRate=5 bootstrap-server=b-2.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092
$CONFLUENT_HOME/bin/ksql-datagen quickstart=users format=avro topic=users msgRate=1 bootstrap-server=b-2.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092 schemaRegistryUrl=http://172.16.3.91:8081

###KSQL###
export CONFLUENT_HOME=/home/ec2-user/environment/confluent-6.1.0
#export KSQL=http://172.16.3.247:8088
export KSQL=http://MskDe-LB8A1-1AS983JAN5YNM-1919033185.ap-southeast-2.elb.amazonaws.com:8088
$CONFLUENT_HOME/bin/ksql $KSQL

CREATE STREAM riderLocations (profileId VARCHAR, latitude DOUBLE, longitude DOUBLE)
  WITH (kafka_topic='locations', value_format='json', partitions=1);

SELECT * FROM riderLocations
  WHERE GEO_DISTANCE(latitude, longitude, 37.4133, -122.1162) <= 5 EMIT CHANGES;

INSERT INTO riderLocations (profileId, latitude, longitude) VALUES ('c2309eec', 37.7877, -122.4205);
INSERT INTO riderLocations (profileId, latitude, longitude) VALUES ('18f4ea86', 37.3903, -122.0643);
INSERT INTO riderLocations (profileId, latitude, longitude) VALUES ('4ab5cbad', 37.3952, -122.0813);
INSERT INTO riderLocations (profileId, latitude, longitude) VALUES ('8b6eae59', 37.3944, -122.0813);
INSERT INTO riderLocations (profileId, latitude, longitude) VALUES ('4a7c7b41', 37.4049, -122.0822);
INSERT INTO riderLocations (profileId, latitude, longitude) VALUES ('4ddad000', 37.7857, -122.4011);


### V1 Mirror Demo

export v1ClusterArn=arn:aws:kafka:ap-southeast-2:383358879677:cluster/msk-demo-v1/0af46ef9-5be5-4496-a38c-b8c7ee83220a-3
export AWS_REGION=ap-southeast-2
aws kafka describe-cluster --region $AWS_REGION --cluster-arn $v1ClusterArn

export v1Broker=b-4.msk-demo-v1.luylpb.c3.kafka.ap-southeast-2.amazonaws.com:9092,b-3.msk-demo-v1.luylpb.c3.kafka.ap-southeast-2.amazonaws.com:9092,b-2.msk-demo-v1.luylpb.c3.kafka.ap-southeast-2.amazonaws.com:9092

export v1ZookeeperConnectString="z-3.msk-demo-v1.luylpb.c3.kafka.ap-southeast-2.amazonaws.com:2181,z-2.msk-demo-v1.luylpb.c3.kafka.ap-southeast-2.amazonaws.com:2181,z-1.msk-demo-v1.luylpb.c3.kafka.ap-southeast-2.amazonaws.com:2181"

bin/kafka-topics.sh --create --zookeeper $v1ZookeeperConnectString --replication-factor 2 --partitions 2 --topic mirrordemo

bin/kafka-topics.sh --create --zookeeper $ZookeeperConnectString --replication-factor 2 --partitions 2 --topic mirrordemo

bin/kafka-console-producer.sh --broker-list b-1.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092,b-4.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092,b-3.msk-demo.g4yywa.c3.kafka.ap-southeast-2.amazonaws.com:9092 --topic mirrordemo

### Demo
#### Mirror V1 to V2
cd ~/environment/msk-demo/mirror
~/environment/msk-demo/kafka_2.12-2.2.1/bin/kafka-mirror-maker.sh --consumer.config v1Consumer.config --num.streams 1 --producer.config v2Producer.config --whitelist=".*"

### Produce on V1
#New Terminal
cd ~/environment/msk-demo/kafka_2.12-2.2.1/bin
./kafka-console-producer.sh --broker-list $v1Broker --topic mirrordemo

### KSQL
New Terminal
export CONFLUENT_HOME=/home/ec2-user/confluent/confluent-6.0.0
export KSQL=http://172.16.3.125:8088
$CONFLUENT_HOME/bin/ksql $KSQL
print mirrordemo;


### KSQL New Demo
export KSQL=http://MskDe-LB8A1-1AS983JAN5YNM-1919033185.ap-southeast-2.elb.amazonaws.com:8088

export KSQL=http://172.16.3.13:8088
$CONFLUENT_HOME/bin/ksql $KSQL

SET 'auto.offset.reset' = 'earliest';


CREATE STREAM streamDemo (
  specVersion VARCHAR,
  type VARCHAR,
  source VARCHAR,
  subject VARCHAR,
  id VARCHAR,
  time VARCHAR,
  data MAP< VARCHAR, VARCHAR > )
  WITH (kafka_topic='AWSKafkaTutorialTopic', 
    timestamp='time',
    timestamp_format='yyyy-MM-dd HH:mm:ss',
    value_format='json',
    partitions=1);

SELECT * FROM streamDemo EMIT CHANGES;


SELECT
  windowStart() AS METRIC_TIMESTAMP, subject AS METRIC_SUBJECT, data['statusCode'] AS METRIC_NAME, count(*) AS METRIC_VALUE
FROM streamDemo
  WINDOW TUMBLING (SIZE 60 SECONDS)
  GROUP BY
    subject,
    data['statusCode']
EMIT CHANGES;

DROP STREAM streamDemo;