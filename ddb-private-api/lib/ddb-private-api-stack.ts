import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as dynamo from '@aws-cdk/aws-dynamodb';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as apigw from '@aws-cdk/aws-apigateway';

export class DdbPrivateApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DDB Table which will be our target
    const table = new dynamo.Table(this, 'table', {
      partitionKey: {
        name: 'pk',
        type: dynamo.AttributeType.STRING,
      },
      billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create a VPC
    const vpc = new ec2.Vpc(this, 'vpc');

    // // Create DDB Gateway Endpoint
    // const dynamoDbEndpoint = vpc.addGatewayEndpoint('DynamoDbEndpoint', {
    //   service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    // });

    // // Policy for DDB Endpoint, only allow put and query to this table
    // dynamoDbEndpoint.addToPolicy(
    //   new iam.PolicyStatement({
    //     principals: [new iam.AnyPrincipal()],
    //     actions: [
    //       'dynamodb:PutItem',
    //       'dynamodb:Query'
    //     ],
    //     resources: [table.tableArn],
    //   })
    // );

    // Create a VPC Endpoint for the private API Gateway
    const vpcEndpointAPIGW = new ec2.InterfaceVpcEndpoint(
      this,
      'VPC Endpoint',
      {
        vpc,
        service: ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
      }
    );

    // Create an API Policy to restrict execution only from VPC
    const apiPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: ["execute-api:Invoke"],
          resources: ["execute-api:/prod/*/*"],
          conditions: {
            "StringNotEquals": {
              "aws:sourceVpc": `${vpc.vpcId}`
            }
          },
          principals: [new iam.AnyPrincipal()]
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["execute-api:Invoke"],
          resources: ["execute-api:/prod/*/*"],
          principals: [new iam.AnyPrincipal()]
        })
      ]
    });

    // Create API Gateway
    const api = new apigw.RestApi(this, 'api', {
      policy: apiPolicy,
      endpointConfiguration: {
        types: [apigw.EndpointType.PRIVATE],
        vpcEndpoints: [vpcEndpointAPIGW],
      },
    });

    // Create a role for API Gateway to used with DDB
    const roleApiDdb = new iam.Role(this, 'roleApiDdb', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    });

    // Give rights to DDB
    roleApiDdb.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
    );

    // Create an API Gateway Integration to insert DDB
    const ddbIntegrationPut = new apigw.AwsIntegration({
      service: 'dynamodb',
      action: 'PutItem',
      options: {
        credentialsRole: roleApiDdb,
        passthroughBehavior: apigw.PassthroughBehavior.NEVER,
        requestTemplates: {
          'application/json': JSON.stringify({
            TableName: table.tableName,
            Item: {
              'pk': {
                S: "$input.path('id')",
              },
              'status': {
                S: "$input.path('status')",
              },
            },
          }),
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': `
                {
                  "id": "$context.requestId"
                }
              `,
            },
          },
        ]
      }
    });

    // Create an API Gateway Integration to query DDB
    const ddbIntegrationQuery = new apigw.AwsIntegration({
      service: 'dynamodb',
      action: 'Query',
      options: {
        credentialsRole: roleApiDdb,
        requestParameters: {
          'integration.request.querystring.id': 'method.request.querystring.id',
        },
        passthroughBehavior: apigw.PassthroughBehavior.NEVER,
        requestTemplates: {
          'application/json': JSON.stringify({
            TableName: table.tableName,
            KeyConditionExpression: 'pk = :pk',
            ExpressionAttributeValues: {
              ':pk': {
                S: "$input.params('id')",
              }
            },
          }),
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': `#set($inputRoot = $input.path('$'))
                  {
                    "execution": [
                      #foreach($elem in $inputRoot.Items) {
                          "name": "$elem.pk.S",
                          "status": "$elem.status.S",
                      }#if($foreach.hasNext),#end
                      #end
                      ]
                  }`,
            },
          },
        ],
      },
    });

    const privateAPIResource = api.root.addResource('private');

    privateAPIResource.addMethod('GET', ddbIntegrationQuery, {
      requestParameters: {
        'method.request.querystring.id': true,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigw.Model.EMPTY_MODEL,
          },
        },
      ],
    });

    privateAPIResource.addMethod('POST', ddbIntegrationPut, {
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigw.Model.EMPTY_MODEL,
          },
        },
      ],
    });
  }
}
