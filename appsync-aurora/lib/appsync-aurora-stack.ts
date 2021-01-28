import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as rds from '@aws-cdk/aws-rds';
import * as appsync from '@aws-cdk/aws-appsync';

export class AppsyncAuroraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const databaseName = 'TESTDB';
    const databaseSchema = 'mysql';

    const vpc = new ec2.Vpc(this, 'vpc', {
      maxAzs: 2
    });

    const serverless = new rds.ServerlessCluster(this, 'cluster', {
      engine: rds.DatabaseClusterEngine.AURORA_MYSQL,
      vpc,
      enableDataApi: true
    });

    const rdsSecretArn = serverless.secret?.secretArn || 'error cannot get secretArn';
    const rdsSecretFullArn = serverless.secret?.secretFullArn || 'error cannot get secretFullArn';

    const api = new appsync.GraphqlApi(this, 'Api', {
      name: 'demo',
      schema: appsync.Schema.fromAsset('./schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.IAM
        },
      },
    });

    const roleAppSync = new iam.Role(this, 'roleAppSync', {
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
    });

    roleAppSync.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: [
        serverless.clusterArn,
        `${serverless.clusterArn}:*`
      ],
      actions: [
        "rds-data:ExecuteStatement",
        "rds-data:DeleteItems",
        "rds-data:ExecuteSql",
        "rds-data:GetItems",
        "rds-data:InsertItems",
        "rds-data:UpdateItems"
      ],
    }));

    roleAppSync.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "secretsmanager:GetSecretValue",
      ],
      resources: [
        rdsSecretFullArn,
        `${rdsSecretFullArn}:*`
      ],
    }));

    // Build a data source for AppSync to access the database.
    const rdsDS = new appsync.CfnDataSource(this, 'rdsDS', {
      name: 'AURORA',  
      apiId: api.apiId,
      type: 'RELATIONAL_DATABASE',
      serviceRoleArn: roleAppSync.roleArn,
      relationalDatabaseConfig: {
        relationalDatabaseSourceType: 'RDS_HTTP_ENDPOINT',
        rdsHttpEndpointConfig: {
          awsRegion: cdk.Aws.REGION,
          awsSecretStoreArn: rdsSecretArn,
          dbClusterIdentifier: serverless.clusterArn,
          databaseName: databaseName,
          schema: databaseSchema
        }
      }
    });


    const query = new appsync.CfnResolver(this, 'Query', {
      apiId: api.apiId,
      dataSourceName: rdsDS.name,
      typeName: 'Query',
      fieldName: 'listPets',
      requestMappingTemplate: `
      {
        "version": "2018-05-29",
        "statements": [
            "select * from Pets"
        ]
      }
      `,
      responseMappingTemplate: `
      $utils.toJson($utils.rds.toJsonObject($ctx.result)[0])
      `,
    });
    query.addDependsOn(rdsDS)

    const mutation = new appsync.CfnResolver(this, 'Mutation', {
      apiId: api.apiId,
      dataSourceName: rdsDS.name,
      typeName: 'Mutation',
      fieldName: 'createPet',
      requestMappingTemplate: `
      #set($id=$utils.autoId())
      {
          "version": "2018-05-29",
          "statements": [
              "insert into Pets VALUES ('$id', '$ctx.args.input.type', $ctx.args.input.price)",
              "select * from Pets WHERE id = '$id'"
          ]
      }
      `,
      responseMappingTemplate: `
      $utils.toJson($utils.rds.toJsonObject($ctx.result)[1][0])
      `,
    });
    mutation.addDependsOn(rdsDS)
   
  }
}
