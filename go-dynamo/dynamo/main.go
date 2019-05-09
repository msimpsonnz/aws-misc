package main

import (
	"encoding/json"
	"net/http"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)



// Handler is executed by AWS Lambda in the main function. Once the request
// is processed, it returns an Amazon API Gateway response object to AWS Lambda
func Handler(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {

	item, err := getItem("11")

	if err != nil {
		return events.APIGatewayProxyResponse{}, err
	}
	res, err := json.Marshal(item)

    return events.APIGatewayProxyResponse{
        StatusCode: http.StatusOK,
        Body:       string(res),
    }, nil
}

func main() {
	lambda.Start(Handler)
}