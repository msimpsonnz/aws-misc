import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as es from '@aws-cdk/aws-elasticsearch';
import * as lambda from '@aws-cdk/aws-lambda';
import { PythonFunction } from '@aws-cdk/aws-lambda-python';
import * as apigw from '@aws-cdk/aws-apigateway';

export class EsKnnStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const esDomain = new es.Domain(this, 'esDomain', {
      version: es.ElasticsearchVersion.V7_7,
    });

    const rolefnesKnn = new iam.Role(this, 'rolefnesKnn', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    rolefnesKnn.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole'
      )
    );

    rolefnesKnn.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ['*'],
        actions: ['es:*'],
      })
    );

    const fnesKnn = new PythonFunction(this, 'fnesKnn', {
      role: rolefnesKnn,
      entry: './function/api', // required
      index: 'app.py', // optional, defaults to 'index.py'
      handler: 'handler', // optional, defaults to 'handler'
      runtime: lambda.Runtime.PYTHON_3_7, // optional, defaults to lambda.Runtime.PYTHON_3_7
    });

    new apigw.LambdaRestApi(this, 'apiEsKnn', {
      handler: fnesKnn,
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS
      }
    });
  


  }
}
