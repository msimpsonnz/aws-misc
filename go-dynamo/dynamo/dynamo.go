package main

import (
    "github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/dynamodb"
    "github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
    // "github.com/aws/aws-sdk-go/service/dynamodb/expression"

    // "fmt"
    // "os"
)

//Item struct for database
type Item struct {
    Year   int `json:"year"`
    Title  string `json:"title"`
    Plot   string `json:"plot"`
    Rating float64 `json:"rating"`
}

var sess = session.Must(session.NewSessionWithOptions(session.Options{
    SharedConfigState: session.SharedConfigEnable,
}))

var db = dynamodb.New(sess)


//Dynamo Get the movies with a minimum rating of 8.0 in 2011
func getItem(title string) (*Item, error) {
    // Prepare the input for the query.
    input := &dynamodb.GetItemInput{
        TableName: aws.String("Movies"),
        Key: map[string]*dynamodb.AttributeValue{
            "Title": {
                S: aws.String(title),
            },
        },
    }

    // Retrieve the item from DynamoDB. If no matching item is found
    // return nil.
    result, err := db.GetItem(input)
    if err != nil {
        return nil, err
    }
    if result.Item == nil {
        return nil, nil
    }

    // The result.Item object returned has the underlying type
    // map[string]*AttributeValue. We can use the UnmarshalMap helper
    // to parse this straight into the fields of a struct. Note:
    // UnmarshalListOfMaps also exists if you are working with multiple
    // items.
    i := new(Item)
    err = dynamodbattribute.UnmarshalMap(result.Item, i)
    if err != nil {
        return nil, err
    }

    return i, nil
}