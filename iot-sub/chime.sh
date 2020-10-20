#!/bin/bash
cd ~/Library/Logs/Amazon\ Chime/
latest=$(ls | sort -n -t _ -k 2 | tail -1)
tail -f "$latest" | grep --line-buffered state= | while read line
do
    echo "$line"
    if [[ $line =~ "state=joined" ]]
    then
        timestamp=$(date "+%Y-%m-%dT%H:%M:%S+1200")
        msg=$(echo "{\"action\": \"StartCall\",\"timestamp\": \"$timestamp\"}" | base64)
        echo "$msg" 
        aws iot-data publish --topic 'action/update' --payload $msg
    elif [[ $line =~ "state=inactive" ]]
    then
        timestamp=$(date "+%Y-%m-%dT%H:%M:%S+1200")
        msg=$(echo "{\"action\": \"StopCall\",\"timestamp\": \"$timestamp\"}" | base64)
        echo "$msg" 
        aws iot-data publish --topic 'action/update' --payload $msg
    fi
done  