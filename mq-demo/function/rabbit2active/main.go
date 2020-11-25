package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/streadway/amqp"
	"github.com/go-stomp/stomp"
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

	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		true,   // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	failOnError(err, "Failed to register a consumer")

	for d := range msgs {
		log.Printf("Received a message: %s", d.Body)
		sendMessages(d.Body)
		break
	}
	return fmt.Sprintf("Ok" ), nil
}

var hostEndpoint = os.Getenv("AWS_MQ_HOSTNAME_MQ")
var queueName = "/queue/client_test"

func sendMessages(msg []byte) {
	println("sendMessages")
	// Create the TLS Connection first

	netConn, err := tls.Dial("tcp", hostEndpoint, &tls.Config{})
	if err != nil {
		log.Fatalln(err.Error())
	}
	defer netConn.Close()

	// Now create the stomp connection
	AWS_MQ_USER := os.Getenv("AWS_MQ_USER")
	AWS_MQ_PASSWORD := os.Getenv("AWS_MQ_PASSWORD")

	stompConn, err := stomp.Connect(netConn,
		stomp.ConnOpt.Login(AWS_MQ_USER, AWS_MQ_PASSWORD))
	if err != nil {
		log.Fatalln(err.Error())
	}

	err = stompConn.Send(queueName, "text/plain",
		msg, nil)
	if err != nil {
	println("failed to send to server", err)
	return
	}


	defer stompConn.Disconnect()
	return
}

func main() {
	lambda.Start(HandleRequest)
}

