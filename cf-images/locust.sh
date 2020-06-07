#!/bin/bash

export host=http://infra-lb8a1-170gjfa2j9yvg-2032599980.ap-southeast-2.elb.amazonaws.com
locust -f ./test.py --no-web -c 10 -r 100 --host=$host --csv=fargate --run-time 1m

export host=https://d1a4dhm9sw7pvy.cloudfront.net
locust -f ./test.py --no-web -c 10 -r 100 --host=$host --csv=cf --run-time 1m