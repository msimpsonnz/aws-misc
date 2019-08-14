# FROM centos AS build
FROM centos

RUN yum install -y \
       java-1.8.0-openjdk \
       java-1.8.0-openjdk-devel

ENV JAVA_HOME /etc/alternatives/jre

RUN cp /usr/lib/jvm/jre-1.8.0-openjdk-1.8.0.222.b10-0.el7_6.x86_64/lib/security/cacerts /tmp/kafka.client.truststore.jks

ADD ./bin/kafka_2.12-2.2.1.tgz /app

COPY ./client.properties /app/kafka_2.12-2.2.1/client.properties

