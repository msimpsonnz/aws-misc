# IoT Job Processor

This solution creates the following
DynamoDB Table
IoT Rule => Lambda Job Processor
    * This creates an IoT job based on "active" records in the DDB table when the thing connects - detected through IoT Lifecycle events
IoT Rule => Lambda Job Updater
    * This updates DDB when the IoT Job is proceed and completed by the thing

## Prereqs
* IoT Thing deployed and registered in IoT Core
* Code to process jobs on the thing, I used [this](https://github.com/aws/aws-iot-device-sdk-python-v2/blob/master/samples/jobs.py) sample as a starter
* NPM, Docker and Parcel installed
* AWS CDK installed `npm -g i aws-cdk@1.60.0`
* AWS CDK bootstrapped in your account, see [here](https://docs.aws.amazon.com/cdk/latest/guide/cli.html#cli-bootstrap)

## Install
1. Git clone the repo
2. `cd aws-mis/iot-job-queue`

3. Deploy the CDK App
`cdk deploy`

4. Grab the table name that the deployment outputs
`export iotjobsampletable='theStringfromAboveOutput'`

5. Get the name of the thing from IoT Core
`export iotjobsamplething='thingNameGoesHere'`

6. Put an active job in DDB
``` bash
cd ./func/jobmaker
npm -i
node index.js --thing $iotjobsamplething --table $iotjobsampletable
```