#!/bin/bash
log stream --predicate 'subsystem == "com.apple.bluetooth"' | grep --line-buffered "audio device Bose QuietComfort 35" | while read line
do
    echo "$line"
    echo "$line" | awk -F] '{print $NF}' | awk -F" " '{print $1F}' 
    action=$(echo "$line" | awk -F] '{print $NF}' | awk -F" " '{print $1F}')
    curl -G --data-urlencode "action=$action" --data-urlencode "topic=status/cloud" http://pi3:5000/action
done