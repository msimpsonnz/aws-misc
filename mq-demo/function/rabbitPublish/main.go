package main

import (
	"context"
	"log"
	"fmt"
	"os"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/streadway/amqp"
)

func failOnError(err error, msg string) {
	if err != nil {
		log.Fatalf("%s: %s", msg, err)
	}
}


func HandleRequest(ctx context.Context) (string, error) {
	AWS_MQ_USER := os.Getenv("AWS_MQ_USER")
	AWS_MQ_PASSWORD := os.Getenv("AWS_MQ_PASSWORD")
	AWS_MQ_HOSTNAME_RABBIT := os.Getenv("AWS_MQ_HOSTNAME_RABBIT")

	amqpConn := fmt.Sprintf("amqps://%s:%s@%s", AWS_MQ_USER, AWS_MQ_PASSWORD, AWS_MQ_HOSTNAME_RABBIT)
	conn, err := amqp.Dial(amqpConn)
	failOnError(err, "Failed to connect to RabbitMQ")
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Failed to open a channel")
	defer ch.Close()

	q, err := ch.QueueDeclare(
		"hello", // name
		false,   // durable
		false,   // delete when unused
		false,   // exclusive
		false,   // no-wait
		nil,     // arguments
	)
	failOnError(err, "Failed to declare a queue")

	body := "Hello World!"
	err = ch.Publish(
		"",     // exchange
		q.Name, // routing key
		false,  // mandatory
		false,  // immediate
		amqp.Publishing{
			ContentType: "text/plain",
			Body:        []byte(body),
		})
	log.Printf(" [x] Sent %s", body)
	failOnError(err, "Failed to publish a message")
	return fmt.Sprintf("Ok" ), nil
}

func main() {
	lambda.Start(HandleRequest)
}
