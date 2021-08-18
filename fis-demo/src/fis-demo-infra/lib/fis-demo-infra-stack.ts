import { aws_ec2 as ec2, aws_rds as rds, aws_lambda_nodejs as lambda_node, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class FisDemoInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'vpc', {
      maxAzs: 2,
    });

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'dbSecurityGroup', {
      vpc,
    });
    dbSecurityGroup.addIngressRule(dbSecurityGroup, ec2.Port.tcp(5432));

    const cluster = new rds.DatabaseCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_12_6,
      }),
      defaultDatabaseName: 'demo',
      credentials: rds.Credentials.fromGeneratedSecret('clusteradmin'),
      instanceProps: {
        // optional , defaults to t3.medium
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE2,
          ec2.InstanceSize.SMALL
        ),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE,
        },
        vpc,
        securityGroups: [
          dbSecurityGroup
        ]
      },
    });

    const fnGetPosts = new lambda_node.NodejsFunction(this, 'fnGetPosts', {
      entry: './functions/getPosts/index.ts',
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE,
      },
      securityGroups: [
        dbSecurityGroup
      ],
      environment: {
        DATABASE_URL: `postgresql://clusteradmin:${cluster.secret?.secretValue.toString}@${cluster.clusterEndpoint}/demo`
      }
    });

  }
}
