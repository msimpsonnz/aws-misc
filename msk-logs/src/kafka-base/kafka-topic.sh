#!/bin/bash
/app/kafka_2.12-2.2.1/bin/kafka-topics.sh --create --zookeeper $AWS_MSK_CLUSTER_ConnectString --replication-factor 3 --partitions 1 --topic $AWS_Kafka_Topic