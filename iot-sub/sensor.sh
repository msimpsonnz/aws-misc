#!/bin/bash
cat /dev/cu.usbmodem1413101 | while read line
do
    echo "$line"
    timestamp=$(date "+%Y-%m-%dT%H:%M:%S+1200")
    echo "$timestamp|$line" >> ~/co2.txt
done