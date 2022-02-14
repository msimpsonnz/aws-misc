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
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"

    "context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"flag"
	"fmt"
	"os"
)

func main() {
	ctx := context.Background()
    // aws config
	awsCfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		fmt.Errorf("error loading default AWS configuration: %w", err)
	}
	awsCfg.Region = "ap-southeast-2"

	appClientIDPtr := flag.String("a", "", "The App Client ID for the user pool")
    appClientSecretPtr := flag.String("s", "", "The App Client Secret for the client ID")
	userNamePtr := flag.String("n", "", "The name of the user")
	passwordPtr := flag.String("p", "", "The password of the user")

	flag.Parse()

    if *appClientIDPtr == "" || *userNamePtr == "" || *passwordPtr == "" {
        fmt.Println("You must supply an app ID, user name and password")
        fmt.Println("Usage: go run InitiateAuth.go -a APP-ID -n USER-NAME -p PASSWORD")
        os.Exit(1)
    }

    idpClient := cognitoidentityprovider.NewFromConfig(awsCfg)

    messageToHash := *userNamePtr + *appClientIDPtr
	h := hmac.New(sha256.New, []byte(*appClientSecretPtr))
	h.Write([]byte(messageToHash))
	secretHash := base64.StdEncoding.EncodeToString(h.Sum(nil))

    authResp, err := idpClient.InitiateAuth(ctx, &cognitoidentityprovider.InitiateAuthInput{
		ClientId: appClientIDPtr,
		AuthFlow: "USER_PASSWORD_AUTH",
		AuthParameters: map[string]string{
			"USERNAME":  *userNamePtr,
			"PASSWORD":  *passwordPtr,
			"SECRET_HASH": secretHash,
		},
	})
	if err != nil {
		fmt.Errorf("error initating auth: %w", err)
	}

    fmt.Printf("%+v", *authResp.AuthenticationResult)
}
