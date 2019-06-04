import autoscaling = require('@aws-cdk/aws-autoscaling');
import cdk = require('@aws-cdk/cdk');
import appstream = require('@aws-cdk/aws-appstream');
import ec2 = require('@aws-cdk/aws-ec2');
import { Group } from '@aws-cdk/aws-iam';

export class WebStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'AppVPC', { cidr: '172.16.0.0/16' });

    const asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.Public
      },
      instanceType: new ec2.InstanceTypePair(ec2.InstanceClass.Burstable2, ec2.InstanceSize.Micro),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AmazonLinux2
      }),
      keyName: 'ec2-general'
      });

    const userData = "sudo yum update -y\r\nsudo amazon-linux-extras install -y lamp-mariadb10.2-php7.2 php7.2\r\nsudo yum install -y httpd mariadb-server\r\nsudo systemctl start httpd\r\nsudo systemctl enable httpd\r\nsudo usermod -a -G apache ec2-user\r\nsudo chown -R ec2-user:apache \/var\/www\r\nsudo chmod 2775 \/var\/www\r\nsudo find \/var\/www -type d -exec chmod 2775 {} \\;\r\nsudo find \/var\/www -type f -exec chmod 0664 {} \\;\r\necho \"<?php phpinfo(); ?>\" > \/var\/www\/html\/phpinfo.php";

    asg.addUserData(userData);

    asg.connections.allowFrom(new ec2.AnyIPv4(), new ec2.TcpPort(80), "Allow HTTP from anywhere");

  }
};


interface AppStackProps extends cdk.StackProps {
  userName: string;
}

export class AppStreamStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  constructor(scope: cdk.Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'AppVPC', { cidr: '10.0.0.0/16' });

    const user = new appstream.CfnUser(this, 'testUser', {
      authenticationType: 'USERPOOL',
      userName: props.userName
    });

    const appStreamStack = new appstream.CfnStack(this, 'appStreamStack');

    appStreamStack.addDependsOn(user);

    const appStreamFleet = new appstream.CfnFleet(this, 'appStreamFleet', {
        computeCapacity: {
            desiredInstances: 1
        },
        fleetType: 'ON_DEMAND',
        instanceType: 'stream.standard.medium',
        vpcConfig: {
            subnetIds: [
                this.vpc.publicSubnets[0].subnetId
            ]
        },
        imageName: 'AppStream-WinServer2012R2-05-28-2019'
    });

    new appstream.CfnStackFleetAssociation(this, 'appStreamAssoc', {
        fleetName: appStreamFleet.ref,
        stackName: appStreamStack.ref
    });

    new appstream.CfnStackUserAssociation(this, 'userAssoc', {
      stackName: appStreamStack.ref,
      authenticationType: 'USERPOOL',
      userName: props.userName
    }).addDependsOn(appStreamStack);

  }
}

interface VpcPeerProps extends cdk.StackProps {
  peerName: string;
  peerRegion: string;
  peerVpcId: string;
  vpcId: string;
}

export class VpcPeerStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: VpcPeerProps) {
    super(scope, id, props);

    new ec2.CfnVPCPeeringConnection(this, props.peerName, {
      peerRegion: props.peerRegion,
      peerVpcId: props.peerVpcId,
      vpcId: props.vpcId
    });
    
  }
};