#!/usr/bin/env bash
dockerTag=trip-worker
ecrRepo=trip-worker

awsAccount=$(aws sts get-caller-identity --output text --query 'Account')
echo "AWS Account: "$awsAccount

docker build . -t $dockerTag

ecrLogin=$(aws ecr get-login --no-include-email)
$ecrLogin

docker tag $dockerTag $awsAccount.dkr.ecr.us-east-1.amazonaws.com/$ecrRepo:latest

docker push $awsAccount.dkr.ecr.us-east-1.amazonaws.com/$ecrRepo:latest
