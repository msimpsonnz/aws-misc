# FROM centos AS build
FROM kafka-base

COPY ./kafka-producer.sh /app
RUN chmod +X -R /app/kafka-producer.sh

ENTRYPOINT [ "/app/kafka-producer.sh" ] 