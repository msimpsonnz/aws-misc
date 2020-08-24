package main

import (
	"strings"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"github.com/aws/aws-sdk-go/aws"
	"fmt"
	"os"
	"context"
	"github.com/aws/aws-sdk-go/aws/session"
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
		uploader := s3manager.NewUploader(sess)

		myBucket := os.Getenv("AWS_S3_BUCKET")
		reader := strings.NewReader(record.Body)
		key := fmt.Sprintf("%s.json", record.MessageId)

		// Upload the file to S3.
		_, err := uploader.Upload(&s3manager.UploadInput{
				Bucket: aws.String(myBucket),
				Key:    aws.String(key),
				Body:   reader,
			})
			if err != nil {
				fmt.Println("Error", err)
				return 
			}
			return
		}
}

func main() {
	lambda.Start(Handler)
}