aws events put-events --entries file://putevents.json --profile eventengine --region ap-southeast-2


aws events test-event-pattern --event-pattern "{\"detailType\": [{\"prefix\": \"ac-\"}", 