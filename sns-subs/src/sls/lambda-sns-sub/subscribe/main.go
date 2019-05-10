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
	Mobile string `json:"mobile"`
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

	smsPtr := msg.Mobile
	topicPtr := "arn:aws:sns:ap-southeast-2:383358879677:mjsdemosns"


    result, err := svc.Subscribe(&sns.SubscribeInput{
        Endpoint:              aws.String(smsPtr),
        Protocol:              aws.String("sms"),
        ReturnSubscriptionArn: aws.Bool(true), // Return the ARN, even if user has yet to confirm
        TopicArn:              aws.String(topicPtr),
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
			Body:       fmt.Sprintf("Job Accepted: %s", string(*result.SubscriptionArn)),
			StatusCode: 200,
		}, nil

}

func main() {
	lambda.Start(handler)
}