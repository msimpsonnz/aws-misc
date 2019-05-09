set GOOS=linux
set GOARCH=amd64

go build -o ./bin/main

sam package --s3-bucket mjsdemorepo-s3 --template-file template.yaml --output-template-file packaged.yaml

sam deploy --template-file packaged.yaml --stack-name mjsdemo-start --capabilities CAPABILITY_IAM