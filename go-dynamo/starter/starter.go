package main

import (
	"encoding/json"
	"fmt"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/sqs"
)

//Message body for batch
type Message struct {
	Batch int `json:"batch"`
}

var sess = session.Must(session.NewSessionWithOptions(session.Options{
	SharedConfigState: session.SharedConfigEnable,
}))

func handler(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {

	var msg Message
	err := json.Unmarshal([]byte(request.Body), &msg)
	if err != nil {
		fmt.Println("There was an error:", err)
	}

	svc := sqs.New(sess)

	qURL := "https://sqs.ap-southeast-2.amazonaws.com/632298589294/sam-app-MySqsQueue-1Q3J5BGF86L1I"

	var res = []*sqs.SendMessageOutput{}

	for index := 0; index < msg.Batch; index++ {
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

	if err != nil {
        fmt.Println("Error", err)
        return events.APIGatewayProxyResponse{
			Body:       fmt.Sprintf("Failed"),
			StatusCode: 500,
		}, nil
	}
	
	return events.APIGatewayProxyResponse{
			Body:       fmt.Sprintf("Job Accepted: %s", string(len(res))),
			StatusCode: 200,
		}, nil

}

func main() {
	lambda.Start(handler)
}