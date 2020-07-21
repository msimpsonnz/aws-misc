#!/bin/bash
for i in 1
do
    # for d in 24 96 120 144 168 192
    # do
    #     # t=$(($i + $d))
        timestamp=$(date -v-${i}H "+%Y-%m-%dT%H:%M:%S+1200")
        echo $timestamp
        action=$(echo "$line" | awk -F] '{print $NF}' | awk -F" " '{print $1F}')
        msg=$(echo "{\"action\": \"Configure\",\"timestamp\": \"$timestamp\"}" | base64)
        aws iot-data publish --topic 'action/update' --payload $msg
    #done
done

