import cdk = require('@aws-cdk/core');
import dynamodb = require('@aws-cdk/aws-dynamodb')
import lambda = require('@aws-cdk/aws-lambda')
import { Runtime } from '@aws-cdk/aws-lambda';


export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dynamoTable = new dynamodb.Table(this, 'connectauto', {
      partitionKey: { name: 'phoneNumber', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    const lambdaCustomerLookup = new lambda.Function(this, 'customerLookup', {
      code: lambda.Code.asset("../functions/cusomerLookup/"),
      handler: "main.handler",
      runtime: lambda.Runtime.PYTHON_3_7,
      environment:{
        AWS_DYNAMODB: dynamoTable.tableName
      }
    });

    dynamoTable.grantReadData(lambdaCustomerLookup);
    

  }
}
