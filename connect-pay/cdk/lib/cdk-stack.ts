import cdk = require('@aws-cdk/core');
import dynamodb = require('@aws-cdk/aws-dynamodb')
import lambda = require('@aws-cdk/aws-lambda')
import apigateway = require('@aws-cdk/aws-apigateway')


export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dynamoTable = new dynamodb.Table(this, 'connectauto', {
      tableName: 'connectauto',
      partitionKey: { name: 'phoneNumber', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'attrib', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    const lambdaCustomerLookup = new lambda.Function(this, 'customerLookup', {
      code: lambda.Code.asset("../functions/cusomerLookup/"),
      handler: "handler.handler",
      runtime: lambda.Runtime.PYTHON_3_7,
      environment:{
        AWS_DYNAMODB: dynamoTable.tableName
      }
    });

    dynamoTable.grantReadData(lambdaCustomerLookup);

    const lambdaMakePaymentExisting = new lambda.Function(this, 'makePaymentExisting', {
      functionName: 'connect-makePaymentExisting',
      code: lambda.Code.asset("../functions/makePaymentExisting/function.zip"),
      handler: "handler.handler",
      runtime: lambda.Runtime.PYTHON_3_7,
      environment:{
        AWS_DYNAMODB: dynamoTable.tableName
      }
    });
    
    dynamoTable.grantReadData(lambdaMakePaymentExisting);

    const lambdaSrtripeLogging = new lambda.Function(this, 'stripeLogging', {
      functionName: 'connect-stripeLogging',
      code: lambda.Code.asset("../functions/stripeLogging/function.zip"),
      handler: "handler.handler",
      runtime: lambda.Runtime.PYTHON_3_7,
      environment:{
        AWS_DYNAMODB: dynamoTable.tableName
      }
    });
    
    dynamoTable.grantReadData(lambdaSrtripeLogging);

    const api = new apigateway.LambdaRestApi(this, 'connect-stripe-api', {
      handler: lambdaSrtripeLogging
    });

  }
}
