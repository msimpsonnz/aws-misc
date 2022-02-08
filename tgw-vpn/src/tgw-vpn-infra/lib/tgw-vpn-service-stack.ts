import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_ec2 as ec2,
  aws_elasticloadbalancingv2 as elbv2,
  aws_elasticloadbalancingv2_targets as elbv2_targets,
} from 'aws-cdk-lib';

export class TgwVpnServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    //####### Const #######//

    //Change this to EC2 Key Pair name
    const ec2KeyName = 'ap2';
    // Node server for EC2
    const nodeServer =
      'https://gist.githubusercontent.com/msimpsonnz/0a1665b6c83bc10067ca7d44b5b1906b/raw/acb0b7ea30c8330190df1d395866bbf58a31756b/echoHeadersNode';

    //--- Service ---//

    const serviceVpc = new ec2.Vpc(this, 'serviceVpc', {
      cidr: '10.10.1.0/24',
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'service',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const serviceInstanceSG = new ec2.SecurityGroup(
      this,
      'serviceInstanceSG',
      {
        vpc: serviceVpc,
        securityGroupName: 'serviceInstanceSG',
        description: 'Allow port 80',
        allowAllOutbound: true,
      }
    );
    serviceInstanceSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'allow public http access'
    );

    const serviceInstance_ec2UserData = ec2.UserData.forLinux();
    serviceInstance_ec2UserData.addCommands(
      'yum install -y gcc-c++ make',
      'curl -sL https://rpm.nodesource.com/setup_14.x | sudo -E bash -',
      'yum install -y nodejs',
      'mkdir /opt/node',
      `curl ${nodeServer} -o /opt/node/server.js`,
      'command node /opt/node/server.js &'
    );

    const serviceInstance = new ec2.Instance(this, 'serviceInstance', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.NANO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      vpc: serviceVpc,
      securityGroup: serviceInstanceSG,
      keyName: ec2KeyName,
      userData: serviceInstance_ec2UserData,
    });

    const serviceInstanceTarget = new elbv2_targets.InstanceTarget(serviceInstance)

    const lb = new elbv2.NetworkLoadBalancer(this, 'lb', {
      vpc: serviceVpc,
      internetFacing: false
    });
    
    // Add a listener on a particular port.
    const listener = lb.addListener('listener', {
      port: 80,
    });
    
    // Add targets on a particular port.
    listener.addTargets('serviceInstanceListener', {
      port: 80,
      targets: [serviceInstanceTarget]
    });

    new ec2.VpcEndpointService(this, 'edndpointService', {
      vpcEndpointServiceLoadBalancers: [lb],
      acceptanceRequired: false,
      //allowedPrincipals: [new iam.ArnPrincipal('arn:aws:iam::123456789012:root')]
    });

    //---------------//



  }
}
