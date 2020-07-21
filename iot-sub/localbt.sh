#!/bin/bash
log stream --predicate 'subsystem == "com.apple.bluetooth"' | grep --line-buffered "audio device Bose QuietComfort 35" | while read line
do
    echo "$line"
    echo "$line" | awk -F] '{print $NF}' | awk -F" " '{print $1F}'
    timestamp=$(date "+%Y-%m-%dT%H:%M:%S+1200")
    action=$(echo "$line" | awk -F] '{print $NF}' | awk -F" " '{print $1F}')
    msg=$(echo "{\"action\": \"$action\",\"timestamp\": \"$timestamp\"}" | base64)
    aws iot-data publish --topic 'action/update' --payload $msg
done