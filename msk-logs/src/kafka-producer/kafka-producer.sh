#!/bin/bash
cd /app/kafka_2.12-2.2.1

while true
do
	bin/kafka-console-producer.sh --broker-list $BootstrapBrokerString --producer.config client.properties --topic $AWS_Kafka_Topic
	sleep 1
done
