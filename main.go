// package main

// import (
// 	"github.com/aws/aws-lambda-go/events"
// 	"github.com/aws/aws-lambda-go/lambda"
// )

// type Item struct {
//     Year   int
//     Title  string
//     Plot   string
//     Rating float64
// }



// // Handler is executed by AWS Lambda in the main function. Once the request
// // is processed, it returns an Amazon API Gateway response object to AWS Lambda
// func Handler(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {

// 	//index, err := ioutil.ReadFile("public/index.html")

// 	evt := events.APIGatewayProxyResponse{
// 		StatusCode: 200,
// 		Body:       "Hello World",
// 		Headers: map[string]string{
// 			"Content-Type": "text/html",
// 		},
// 	}

// 	// if err != nil {
// 	// 	return events.APIGatewayProxyResponse{}, err
// 	// }

// 	return evt, nil
// }

// func main() {
// 	lambda.Start(Handler)
// }
package main

func main() {
	Dynamo()
}