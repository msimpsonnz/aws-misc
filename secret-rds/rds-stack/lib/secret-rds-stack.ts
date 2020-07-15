// Forked from https://github.com/cdk-patterns/serverless/tree/master/the-rds-proxy
import { CfnOutput, Construct, RemovalPolicy, Stack, StackProps } from '@aws-cdk/core';
import {
  InstanceClass,
  InstanceType,
  InstanceSize,
  Port,
  SecurityGroup,
  Vpc,
} from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
import { Secret } from '@aws-cdk/aws-secretsmanager';
import { StringParameter } from '@aws-cdk/aws-ssm';


export class RDSProxyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
  
    // Setup networking
    const vpc = new Vpc(this, 'Vpc');
    // Add Security Groups
    const sgLambda2Proxy = new SecurityGroup(this, 'sgLambda2Proxy', { vpc });
    const sgProxy2RDS = new SecurityGroup(this, 'sgProxy2RDS', { vpc });
    sgProxy2RDS.addIngressRule(sgProxy2RDS, Port.tcp(3306));
    sgProxy2RDS.addIngressRule(sgLambda2Proxy, Port.tcp(3306));

    const secretRDS = new Secret(this, 'secretRDS', {
      secretName: id + '-rds-credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'rdsuser',
        }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: 'password',
      },
    });

    new StringParameter(this, 'ssmParamSecretRDSArn', {
      parameterName: 'demo-secret-rds',
      stringValue: secretRDS.secretArn,
    });

    const rdsInstance = new rds.DatabaseInstance(this, 'DBInstance', {
      engine: rds.DatabaseInstanceEngine.MYSQL,
      masterUsername: secretRDS.secretValueFromJson('username').toString(),
      masterUserPassword: secretRDS.secretValueFromJson('password'),
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE2,
        InstanceSize.SMALL
      ),
      vpc,
      removalPolicy: RemovalPolicy.DESTROY,
      deletionProtection: false,
      securityGroups: [sgProxy2RDS],
    });

    // Create an RDS Proxy
    const proxy = rdsInstance.addProxy(id + '-proxy', {
      secret: secretRDS,
      debugLogging: true,
      vpc,
      securityGroups: [sgProxy2RDS],
    });

    // Workaround for bug where TargetGroupName is not set but required
    let targetGroup = proxy.node.children.find((child: any) => {
      return child instanceof rds.CfnDBProxyTargetGroup;
    }) as rds.CfnDBProxyTargetGroup;

    targetGroup.addPropertyOverride('TargetGroupName', 'default');

    const secretArn = new CfnOutput(this, 'rds-secretArn', {
      value: secretRDS.secretArn ?? 'ERROR with deployment',
      exportName: 'rds-secretArn'
    });

  }
}