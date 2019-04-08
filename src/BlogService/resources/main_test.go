package main

import (
	"github.com/aws/aws-lambda-go/events"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestHandler(t *testing.T) {

	request := events.APIGatewayProxyRequest{}
	expectedResponse := events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type": "text/html",
		},
		Body: "Congratulations",
	}

	response, err := Handler(request)

	assert.Equal(t, response.Headers, expectedResponse.Headers)
	assert.Contains(t, response.Body, expectedResponse.Body)
	assert.Equal(t, err, nil)

}
