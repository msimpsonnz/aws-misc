aws lambda add-permission --function-name CustomRuntime \
--statement-id load-balancer --action "lambda:InvokeFunction" \
--principal elasticloadbalancing.amazonaws.com \
--region ap-southeast-2

aws lambda add-permission --function-name alb-baseline \
--statement-id load-balancer --action "lambda:InvokeFunction" \
--principal elasticloadbalancing.amazonaws.com \
--region ap-southeast-2