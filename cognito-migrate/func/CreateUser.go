/*
   Copyright 2010-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.

   This file is licensed under the Apache License, Version 2.0 (the "License").
   You may not use this file except in compliance with the License. A copy of
   the License is located at

    http://aws.amazon.com/apache2.0/

   This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
   CONDITIONS OF ANY KIND, either express or implied. See the License for the
   specific language governing permissions and limitations under the License.
*/
package main

import (
    "github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/cognitoidentityprovider"

    "flag"
    "fmt"
    "os"
)

func main() {
    emailIDPtr := flag.String("e", "", "The email address of the user")
    //userPoolIDPtr := flag.String("p", "", "The ID of the user pool")
    userNamePtr := flag.String("n", "", "The name of the user")
	flag.Parse()

	userPoolIDPtr := "ap-southeast-2_0y2sKReFQ"

    if *emailIDPtr == "" || *userPoolIDPtr == "" || *userNamePtr == "" {
        fmt.Println("You must supply an email address, user pool ID, and user name")
        fmt.Println("Usage: go run CreateUser.go -e EMAIL-ADDRESS -p USER-POOL-ID -n USER-NAME")
        os.Exit(1)
    }

    // Initialize a session that the SDK will use to load
    // credentials from the shared credentials file ~/.aws/credentials.
    sess := session.Must(session.NewSessionWithOptions(session.Options{
        SharedConfigState: session.SharedConfigEnable,
    }))

    cognitoClient := cognitoidentityprovider.New(sess)

    newUserData := &cognitoidentityprovider.AdminCreateUserInput{
        DesiredDeliveryMediums: []*string{
            aws.String("EMAIL"),
        },
        UserAttributes: []*cognitoidentityprovider.AttributeType{
            {
                Name:  aws.String("email"),
                Value: aws.String(*emailIDPtr),
            },
        },
    }

    newUserData.SetUserPoolId(*userPoolIDPtr)
    newUserData.SetUsername(*userNamePtr)

    _, err := cognitoClient.AdminCreateUser(newUserData)
    if err != nil {
        fmt.Println("Got error creating user:", err)
    }



}