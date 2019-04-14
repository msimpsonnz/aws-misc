package main

import (
	"github.com/aws/aws-sdk-go/aws"
	"os"
	"fmt"
	"encoding/json"
	"github.com/aws/aws-sdk-go/aws/session"
	svcLambda "github.com/aws/aws-sdk-go/service/lambda"
)

var sess = session.Must(session.NewSessionWithOptions(session.Options{
    SharedConfigState: session.SharedConfigEnable,
}))

func main() {
	client := svcLambda.New(sess)

	payload, err := json.Marshal(map[string]interface{}{
		"message": "message to other lambda func",
	})

	result, err := client.Invoke(&svcLambda.InvokeInput{FunctionName: aws.String("dynamo-go-HelloWorldFunction-F1D3K0FM6TRX"), Payload: payload})
	if err != nil {
		fmt.Println("Error calling MyGetItemsFunction")
		os.Exit(0)
		}

	//res, err := json.Unmarshal(string(result.Payload))

	fmt.Println(string(result.Payload))
}