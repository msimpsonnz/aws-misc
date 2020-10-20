#!/bin/bash
log stream --predicate 'eventMessage CONTAINS[c] "Bose QuietComfort 35 published in HAL" || eventMessage CONTAINS[c] "Remove audio device Bose QuietComfort 35" || eventMessage CONTAINS[c] "Post event kCameraStreamStart" || eventMessage CONTAINS[c] "Post event kCameraStreamStop" || eventMessage CONTAINS[c] "Input Kind:          Mic" || eventMessage CONTAINS[c] "- IOAudioEngine[<private>]::"' | while read line
do
    echo "$line"
    if [[ $line =~ "Remove audio device Bose QuietComfort 35" ]]
    then
        echo "$line" | awk -F] '{print $NF}' | awk -F" " '{print $1F}'
        timestamp=$(date "+%Y-%m-%dT%H:%M:%S+1200")
        action=$(echo "$line" | awk -F] '{print $NF}' | awk -F" " '{print $1F}')
        msg=$(echo "{\"action\": \"$action\",\"timestamp\": \"$timestamp\"}" | base64)
        echo "$msg" 
        aws iot-data publish --topic 'action/update' --payload $msg
    elif [[ $line =~ "Bose QuietComfort 35 published in HAL" ]]
    then
        timestamp=$(date "+%Y-%m-%dT%H:%M:%S+1200")
        msg=$(echo "{\"action\": \"Configure\",\"timestamp\": \"$timestamp\"}" | base64)
        echo "$msg" 
        aws iot-data publish --topic 'action/update' --payload $msg
    # elif [[ $line =~ "Input Kind:          Mic" ]]
    # then
    #     timestamp=$(date "+%Y-%m-%dT%H:%M:%S+1200")
    #     msg=$(echo "{\"action\": \"StartCall\",\"timestamp\": \"$timestamp\"}" | base64)
    #     echo "$msg" 
    #     aws iot-data publish --topic 'action/update' --payload $msg
    # elif [[ $line =~ "- IOAudioEngine[<private>]::startAudioEngine() returns 0x0" ]]
    # then
    #     timestamp=$(date "+%Y-%m-%dT%H:%M:%S+1200")
    #     msg=$(echo "{\"action\": \"StartCall\",\"timestamp\": \"$timestamp\"}" | base64)
    #     echo "$msg" 
    #     aws iot-data publish --topic 'action/update' --payload $msg
    # elif [[ $line =~ "- IOAudioEngine[<private>]::stopAudioEngine() returns 0x0" ]]
    # then
    #     timestamp=$(date "+%Y-%m-%dT%H:%M:%S+1200")
    #     msg=$(echo "{\"action\": \"StopCall\",\"timestamp\": \"$timestamp\"}" | base64)
    #     echo "$msg" 
    #     aws iot-data publish --topic 'action/update' --payload $msg
    elif [[ $line =~ "kCameraStream" ]]
    then
        timestamp=$(date "+%Y-%m-%dT%H:%M:%S+1200")
        action=$(echo "$line" | rev | cut -d " " -f1 | rev)
        msg=$(echo "{\"action\": \"$action\",\"timestamp\": \"$timestamp\"}" | base64)
        echo "$msg" 
        aws iot-data publish --topic 'action/update' --payload $msg
    fi

done  