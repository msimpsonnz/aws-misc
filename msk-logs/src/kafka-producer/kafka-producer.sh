#!/bin/bash
cd /app/kafka_2.12-2.2.1

while true
do
	bin/kafka-console-producer.sh --broker-list $AWS_MSK_BOOTSTRAP --producer.config client.properties --topic $AWS_KAFKA_TOPIC
	sleep 1
done
