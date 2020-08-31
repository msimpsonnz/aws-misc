#/bin/bash
aws cloudformation delete-stack --stack-name AmplifyConsoleDemo

aws codecommit delete-repository --repository-name mydemorepo

rm -rf ./mydemorepo
