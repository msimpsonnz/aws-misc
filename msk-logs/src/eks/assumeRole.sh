#!/bin/bash
unset AWS_ACCESS_KEY_ID
unset AWS_SESSION_TOKEN
unset AWS_SECRET_ACCESS_KEY

export CDK_AWS_ACCOUNT=$(aws sts get-caller-identity | jq -r .Account)
export ASSUME_ROLE=$(aws sts assume-role --role-arn arn:aws:iam::$CDK_AWS_ACCOUNT:role/msk-demo-stack-AdminRole38563C57-1PGU4XTWJAHY6 --role-session-name AWSCLI-Session)

export AWS_ACCESS_KEY_ID=$(echo $ASSUME_ROLE | jq -r .Credentials.AccessKeyId)
export AWS_SESSION_TOKEN=$(echo $ASSUME_ROLE | jq -r .Credentials.SessionToken)
export AWS_SECRET_ACCESS_KEY=$(echo $ASSUME_ROLE | jq -r .Credentials.SecretAccessKey)

aws sts get-caller-identity