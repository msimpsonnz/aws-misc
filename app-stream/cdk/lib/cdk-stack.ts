import autoscaling = require('@aws-cdk/aws-autoscaling');
import cdk = require('@aws-cdk/cdk');
import appstream = require('@aws-cdk/aws-appstream');
import ec2 = require('@aws-cdk/aws-ec2');

export class WebStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'AppVPC', { cidr: '172.16.0.0/16' });

    // const asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
    //   vpc,
    //   instanceType: new ec2.InstanceTypePair(ec2.InstanceClass.Burstable2, ec2.InstanceSize.Micro),
    //   machineImage: new ec2.AmazonLinuxImage(),
    // });

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
        fleetType: 'ON_DEMAND'
        instanceType: 'stream.standard.medium',
        vpcConfig: {
            subnetIds: [
                this.vpc.publicSubnets[0].subnetId
            ]
        },
        imageName: 'Amazon-AppStream2-Sample-Image-02-04-2019'
    });

    const fleeAssoc = new appstream.CfnStackFleetAssociation(this, 'appStreamAssoc', {
        fleetName: appStreamFleet.ref,
        stackName: appStreamStack.ref
    });

    const userAssoc = new appstream.CfnStackUserAssociation(this, 'userAssoc', {
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

    const vpcPeer = new ec2.CfnVPCPeeringConnection(this, props.peerName, {
      peerRegion: props.peerRegion,
      peerVpcId: props.peerVpcId,
      vpcId: props.vpcId
    });
    
  }
};

export class WebPeerStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: VpcPeerProps) {
    super(scope, id, props);

    const vpcPeer = new ec2.CfnVPCPeeringConnection(this, props.peerName, {
      peerRegion: props.peerRegion,
      peerVpcId: props.peerVpcId,
      vpcId: props.vpcId
    });
    
  }
};