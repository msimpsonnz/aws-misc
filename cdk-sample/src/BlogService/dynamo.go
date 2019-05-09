//https://github.com/awsdocs/aws-doc-sdk-examples/blob/master/go/example_code/dynamodb/DynamoDBReadItem.go
package main

import (
    "github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/dynamodb"
    "github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"

    "fmt"
)

//Item struct for database
type Item struct {
    Year   int
    Title  string
    Plot   string
    Rating float64
}

