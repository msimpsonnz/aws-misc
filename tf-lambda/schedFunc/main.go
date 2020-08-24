package main

import (
	"fmt"
	"os"
	
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/sqs"
)

var sess = session.Must(session.NewSessionWithOptions(session.Options{
	SharedConfigState: session.SharedConfigEnable,
}))

func handler(request events.CloudWatchEvent) {
	svc := sqs.New(sess)

	qURL := os.Getenv("AWS_SQS_URL")

	var res = []*sqs.SendMessageOutput{}

	for index := 0; index < 10; index++ {
		result, err := svc.SendMessage(&sqs.SendMessageInput{
			DelaySeconds: aws.Int64(10),
			MessageBody: aws.String("Go...go...go"),
			QueueUrl:    &qURL,
		})
		res = append(res, result)
		if err != nil {
			fmt.Println("Error", err)
		}
	}

	return

}

func main() {
	lambda.Start(handler)
}