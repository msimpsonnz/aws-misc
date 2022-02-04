```bash
function pingEndpoint () {
    jobId=$(aws ssm send-command --document-name "AWS-RunShellScript" --document-version "1" --targets "[{\"Key\":\"InstanceIds\",\"Values\":[ \"$instanceId\" ]}]" --parameters '{"workingDirectory":[""],"executionTimeout":["3600"],"commands":["ping 54.221.221.27"]}' --timeout-seconds 600 --max-concurrency "50" --max-errors "0" | jq -r .Command.CommandId)
}

function curlEndpoint () {
    jobId=$(aws ssm send-command --document-name "AWS-RunShellScript" --document-version "1" --targets "[{\"Key\":\"InstanceIds\",\"Values\":[ \"$instanceId\" ]}]" --parameters '{"workingDirectory":[""],"executionTimeout":["3600"],"commands":["curl http://54.221.221.27"]}' --timeout-seconds 600 --max-concurrency "50" --max-errors "0" | jq -r .Command.CommandId)
}


function pollJob () {
    jobResult=$(aws ssm get-command-invocation --command-id $1 --instance-id $instanceId)
}


export instanceId=i-06041d04f146a5871
loop=0
while [ "$loop" = 0 ]
do  
    echo $jobId
    pollJob "$jobId"
    if echo "$jobResult" | grep -q "\"Status\": \"Success\""; then
        echo "Done"
        echo $jobResult
        loop=1
    fi
    echo "$jobResult" | grep -q "\"Status\""
    sleep=1
done

```

