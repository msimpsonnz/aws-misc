# export apiUrl="https://mxjbm5b360.execute-api.ap-southeast-2.amazonaws.com/prod/executions"
# export ulid=$(node ~/r/zscratch/ulid/ulid.js) && curl --header "Content-Type: application/json" \
# --request POST \
# --data $ulid \
# $apiUrl 

# export apiUrlv2=https://26catoczf9.execute-api.ap-southeast-2.amazonaws.com/prod/executions
# export ulid=$(node ulid.js) && curl --header "Content-Type: application/json" \
# --request POST \
# --data $ulid \
# $apiUrlv2 


# {"executionArn":"arn:aws:states:ap-southeast-2:383358879677:execution:sfnParentDD689E99-TuTz2DJ9OdPY:dbed14d7-0877-46ea-9d93-d4802e8ebf40","startDate":1.601499427807E9}

export apiUrl="https://mxjbm5b360.execute-api.ap-southeast-2.amazonaws.com/prod/workflow/execution/sfnStateMachineWorker1"
export ulid=$(node ~/r/zscratch/ulid/ulid.js)
export data="{\"name\": \"${ulid}\", \"input\": [\"${ulid}\"]}"

curl --header "Content-Type: application/json" \
--request POST \
--data $data \
${apiUrl}