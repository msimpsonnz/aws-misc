#!/bin/bash
export host=http://lambda-alb-1216738155.ap-southeast-2.elb.amazonaws.com
#locust -f ./net21-newton/test.py --no-web -c 1000 -r 100 --host=$host --csv=net21-newton --run-time 5m
locust -f ./net30-newton/test.py --no-web -c 1000 -r 100 --host=$host --csv=net30-newton --run-time 1m
locust -f ./net30-native/test.py --no-web -c 1000 -r 100 --host=$host --csv=net30-native --run-time 1m