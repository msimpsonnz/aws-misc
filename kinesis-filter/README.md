# Welcome to your CDK TypeScript project!

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template


aws kinesisanalyticsv2 describe-application --application-name kinesisApp_okdrCO6QEDEg

aws kinesisanalyticsv2 start-application --generate-cli-skeleton

{
    "ApplicationName": "kinesisApp_okdrCO6QEDEg",
    "RunConfiguration": {
        "SqlRunConfigurations": [
            {
                "InputId": "1.1",
                "InputStartingPositionConfiguration": {
                    "InputStartingPosition": "NOW"
                }
            }
        ],
    }
}

aws kinesisanalyticsv2 start-application --cli-input-json '{"ApplicationName": "kinesisApp_okdrCO6QEDEg","RunConfiguration": {"SqlRunConfigurations": [{"InputId": "1.1","InputStartingPositionConfiguration": {"InputStartingPosition": "NOW"}}]}}'

aws kinesisanalyticsv2 stop-application --application-name kinesisApp_okdrCO6QEDEg