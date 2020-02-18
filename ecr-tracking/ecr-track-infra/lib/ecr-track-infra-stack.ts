import * as cdk from '@aws-cdk/core';
import cloudtrail = require('@aws-cdk/aws-cloudtrail');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import targets = require('@aws-cdk/aws-events-targets');
import lambda = require('@aws-cdk/aws-lambda-nodejs');
//import lambda = require('@aws-cdk/aws-lambda');

export class EcrTrackInfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const trail = new cloudtrail.Trail(this, 'CloudTrail');

    const dynamodbTable = new dynamodb.Table(this, 'ecr-tracker-table', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    const fnCreateTracker = new lambda.NodejsFunction(this, 'fnCreateTracker', {
      entry: 'func/ecr-tracker-create.ts',
      handler: 'handler',
      environment: {
        DYNAMODB_TABLE: dynamodbTable.tableName
      }
    });

    const fnUpdateTracker = new lambda.NodejsFunction(this, 'fnUpdateTracker', {
      entry: 'func/ecr-tracker-update.ts',
      handler: 'handler',
      environment: {
        DYNAMODB_TABLE: dynamodbTable.tableName
      }
    });
    
    dynamodbTable.grantReadWriteData(fnCreateTracker);
    dynamodbTable.grantReadWriteData(fnUpdateTracker);

    trail.onCloudTrailEvent('publish-ECR-Event-Create', {
      target: new targets.LambdaFunction(fnCreateTracker),
      eventPattern: {
        source: ['aws.ecr'],
        detail: {
          eventName: ['PutImage']
        }
      }
    });

    trail.onCloudTrailEvent('publish-ECR-Event-Update', {
      target: new targets.LambdaFunction(fnUpdateTracker),
      eventPattern: {
        source: ['aws.ecr'],
        detail: {
          eventName: ['BatchGetImage']
        }
      }
    });

  }
}
