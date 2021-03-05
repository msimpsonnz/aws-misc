import * as cdk from '@aws-cdk/core';
//import { DynamoDBTable } from '../../../cdk-constructs/src/dynamodb'
import * as iam from '@aws-cdk/aws-iam';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as sqs from '@aws-cdk/aws-sqs';
import * as lambda from '@aws-cdk/aws-lambda';
import * as lambdaNode from '@aws-cdk/aws-lambda-nodejs';
import { DynamoEventSource, SqsDlq } from '@aws-cdk/aws-lambda-event-sources';
import * as apigw from '@aws-cdk/aws-apigateway';

export class DdbStreamAggStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //const table = new DynamoDBTable(this, 'table');

    // DDB Table which will be our target
    const table = new dynamodb.Table(this, 'table', {
      partitionKey: {
        name: 'pk',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: dynamodb.AttributeType.STRING,
      },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      timeToLiveAttribute: 'ttl',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const deadLetterQueue = new sqs.Queue(this, 'deadLetterQueue');

    const fnStreamProc = new lambdaNode.NodejsFunction(this, 'fnStreamProc', {
      entry: './functions/streamProc/index.ts',
      runtime: lambda.Runtime.NODEJS_14_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(60),
      environment: {
        AWS_DYNAMODB_TABLE_NAME: table.tableName
      }
    })

    fnStreamProc.addEventSource(new DynamoEventSource(table, {
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
      batchSize: 100,
      bisectBatchOnError: true,
      onFailure: new SqsDlq(deadLetterQueue),
      retryAttempts: 10
    }));

    table.grantWriteData(fnStreamProc);


    // Create a role for API Gateway to used with DDB
    const roleApiDdb = new iam.Role(this, 'roleApiDdb', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    });

    // Give rights to DDB
    roleApiDdb.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
    );

    const api = new apigw.RestApi(this, 'api', {
      restApiName: this.stackId,
    });
    const dynamodbAPI = api.root.addResource('dynamodb');

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
              pk: {
                S: "$input.path('id')",
              },
              sk: {
                S: "$input.path('time')",
              },
              version: {
                S: "$input.path('version')",
              },
              type: {
                S: "$input.path('type')",
              },
              source: {
                S: "$input.path('source')",
              },
              subject: {
                S: "$input.path('subject')",
              },
              data: {
                M: {
                  statusCode: {
                    N: "$input.path('data.statusCode')"
                  }
                }
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
        ],
      },
    });

    // Create an API Gateway Integration to query DDB
    const ddbIntegrationQuery = new apigw.AwsIntegration({
      service: 'dynamodb',
      action: 'Query',
      options: {
        credentialsRole: roleApiDdb,
        requestParameters: {
          'integration.request.querystring.date': 'method.request.querystring.date',
        },
        passthroughBehavior: apigw.PassthroughBehavior.NEVER,
        requestTemplates: {
          'application/json': JSON.stringify({
            TableName: table.tableName,
            KeyConditionExpression: 'pk = :pk',
            ExpressionAttributeValues: {
              ':pk': {
                S: "$input.params('date')",
              },
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
                                "date": "$elem.pk.S",
                                "type": "$elem.type.S",
                                "events": $elem.events.N,
                            }#if($foreach.hasNext),#end
                            #end
                            ]
                        }`,
            },
          },
        ],
      },
    });

    dynamodbAPI.addMethod('GET', ddbIntegrationQuery, {
      requestParameters: {
        'method.request.querystring.date': true,
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

    dynamodbAPI.addMethod('POST', ddbIntegrationPut, {
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
