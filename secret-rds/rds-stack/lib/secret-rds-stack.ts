// Forked from https://github.com/cdk-patterns/serverless/tree/master/the-rds-proxy
import {
  CfnOutput,
  Construct,
  RemovalPolicy,
  Stack,
  StackProps,
} from '@aws-cdk/core';
import {
  InstanceClass,
  InstanceType,
  InstanceSize,
  Port,
  SecurityGroup,
  Vpc,
} from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
import {
  Secret
} from '@aws-cdk/aws-secretsmanager';
import * as lambda from '@aws-cdk/aws-lambda';
import apigw = require('@aws-cdk/aws-apigatewayv2');

export class RDSProxyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Get Environment Param
    const environment = this.node.tryGetContext('environment');

    // Setup networking
    const vpc = new Vpc(this, 'Vpc', {
      maxAzs: 2,
    });
    // Add Security Groups
    const sgLambda2Proxy = new SecurityGroup(this, 'sgLambda2Proxy', { vpc });
    const sgProxy2RDS = new SecurityGroup(this, 'sgProxy2RDS', { vpc });
    sgProxy2RDS.addIngressRule(sgProxy2RDS, Port.tcp(3306));
    sgProxy2RDS.addIngressRule(sgLambda2Proxy, Port.tcp(3306));

    const rdsInstance = new rds.DatabaseInstance(this, 'DBInstance', {
      engine: rds.DatabaseInstanceEngine.MYSQL,
      masterUsername: 'masteruser',
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE2,
        InstanceSize.SMALL
      ),
      vpc,
      removalPolicy: (environment === 'PROD') ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      deletionProtection: (environment === 'PROD') ? true : false,
      securityGroups: [sgProxy2RDS],
    });
    
    let rdsSecret = rdsInstance.secret || new Secret(this, 'ERROR: Cannot find RDS secret');

    if (environment === 'PROD') {
      const myUserSecret = new rds.DatabaseSecret(this, 'myUserSecret', {
        username: 'rdsuser',
        masterSecret: rdsInstance.secret,
      });
      const myUserSecretAttached = myUserSecret.attach(rdsInstance);

      rdsInstance.addRotationMultiUser('rdsuser', {
        secret: myUserSecretAttached
      });

      rdsSecret = myUserSecret
    }  

    // Create an RDS Proxy
    const proxy = rdsInstance.addProxy(`${environment}-rds-proxy`, {
      secret: rdsSecret,
      debugLogging: true,
      vpc,
      securityGroups: [sgProxy2RDS],
    });

    // Workaround for bug where TargetGroupName is not set but required
    let targetGroup = proxy.node.children.find((child: any) => {
      return child instanceof rds.CfnDBProxyTargetGroup;
    }) as rds.CfnDBProxyTargetGroup;

    targetGroup.addPropertyOverride('TargetGroupName', 'default');

    // Lambda to Interact with RDS Proxy
    const rdsLambda = new lambda.Function(this, 'rdsProxyHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.asset('functions/rds'),
      handler: 'index.handler',
      vpc: vpc,
      securityGroups: [sgLambda2Proxy],
      environment: {
        PROXY_ENDPOINT: proxy.endpoint,
        RDS_SECRET_NAME: rdsSecret.secretArn
      },
    });

    rdsSecret.grantRead(rdsLambda);

    // defines an API Gateway Http API resource backed by our "rdsLambda" function.
    const api = new apigw.HttpApi(this, 'Endpoint', {
      defaultIntegration: new apigw.LambdaProxyIntegration({
        handler: rdsLambda,
      }),
      createDefaultStage: true,
    });

    const apiURL = new CfnOutput(this, 'apiURL', {
      value: api.url ?? 'ERROR with deployment',
    });
  }
}
