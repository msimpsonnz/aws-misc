import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import ec2 = require('@aws-cdk/aws-ec2');
import eks = require('@aws-cdk/aws-eks');

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const clusterAdmin = new iam.Role(this, 'eks-AdminRole', {
      assumedBy: new iam.AccountRootPrincipal()
    });

    const eksCluster = new eks.Cluster(this, 'cluster', {
      defaultCapacity: 1,
      defaultCapacityInstance: new ec2.InstanceType('m2.xlarge'),
      mastersRole: clusterAdmin
    });

    eksCluster.addCapacity('frontend-nodes', {
      instanceType: new ec2.InstanceType('t2.medium'),
      desiredCapacity: 1,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC }
    });

  }
}
