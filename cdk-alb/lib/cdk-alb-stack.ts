import autoscaling = require('@aws-cdk/aws-autoscaling');
import ec2 = require('@aws-cdk/aws-ec2');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import cdk = require('@aws-cdk/cdk');
import { IpTarget } from '@aws-cdk/aws-elasticloadbalancingv2';
import { SubnetType } from '@aws-cdk/aws-ec2';

export class CdkAlbStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'PocVPC', {
      cidr: '10.0.0.0/21',
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Ingress',
          subnetType: SubnetType.Public
        }
      ]
    });

    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true
    });

    const listener = lb.addListener('Listener', {
      port: 80,
    });

    const targets = new IpTarget("10.99.99.99", 80, "all")

    listener.addTargets('Target', {
      port: 80,
      targets: [
        targets
      ]
    });

    listener.connections.allowDefaultPortFromAnyIpv4('Open to the world');

  }
}
