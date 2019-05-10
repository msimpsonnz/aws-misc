package main

import (
	"encoding/json"
	"fmt"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/sns"
)

//Message body for batch
type Message struct {
	Body string `json:"body"`
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

	svc := sns.New(sess)

	message := msg.Body
	topicPtr := "arn:aws:sns:ap-southeast-2:383358879677:mjsdemosns"


    result, err := svc.Publish(&sns.PublishInput{
        Message:  aws.String(message),
        TopicArn: aws.String(topicPtr),
    })
		if err != nil {
			fmt.Println("Error", err)
		}

	if err != nil {
        fmt.Println("Error", err)
        return events.APIGatewayProxyResponse{
			Body:       fmt.Sprintf("Failed"),
			StatusCode: 500,
		}, nil
	}
	
	return events.APIGatewayProxyResponse{
			Body:       fmt.Sprintf("Job Accepted: %s", string(*result.MessageId)),
			StatusCode: 200,
		}, nil

}

func main() {
	lambda.Start(handler)
}