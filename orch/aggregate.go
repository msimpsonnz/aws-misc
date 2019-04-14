package main

import (
	"github.com/aws/aws-sdk-go/aws"
	"fmt"
	"os"
	"context"
	"encoding/json"
	// "net/http"
	"github.com/aws/aws-sdk-go/aws/session"
	svcLambda "github.com/aws/aws-sdk-go/service/lambda"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

var sess = session.Must(session.NewSessionWithOptions(session.Options{
    SharedConfigState: session.SharedConfigEnable,
}))
// Handler is executed by AWS Lambda in the main function. Once the request
// is processed, it returns an Amazon API Gateway response object to AWS Lambda
func Handler(ctx context.Context, sqsEvent events.SQSEvent) {
	for _, record := range sqsEvent.Records {
		sqsRecord := record.MessageId

		fmt.Println(sqsRecord)
		client := svcLambda.New(sess)

		payload, err := json.Marshal(map[string]interface{}{
			"message": "message to other lambda func",
		})

		result, err := client.Invoke(&svcLambda.InvokeInput{FunctionName: aws.String("dynamo-go-HelloWorldFunction-F1D3K0FM6TRX"), Payload: payload})
		if err != nil {
			fmt.Println("Error calling MyGetItemsFunction")
			os.Exit(0)
			}

		fmt.Println(result)
	}
}

func main() {
	lambda.Start(Handler)
}