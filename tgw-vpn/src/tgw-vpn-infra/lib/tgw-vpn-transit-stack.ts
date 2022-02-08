import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    aws_iam as iam,
    aws_ec2 as ec2
} from 'aws-cdk-lib';

export class TgwVpnTransitStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const vpceId = 'com.amazonaws.vpce.ap-southeast-2.vpce-svc-0f067008beb9c09f6';
        const cgwIp = '52.62.6.248';
        const destinationCidrBlock = '10.10.1.0/24';
        //--- Transit ---//

        const vpc = new ec2.Vpc(this, 'transitVpc', {
            cidr: '54.221.221.0/24',
            maxAzs: 2,
            subnetConfiguration: [
                {
                    name: 'transit',
                    subnetType: ec2.SubnetType.PUBLIC,
                },
            ]
        });

        const cgw = new ec2.CfnCustomerGateway(this, 'cgw', {
            ipAddress: cgwIp,
            type: 'ipsec.1',
            bgpAsn: 65000
        });

        const tgw = new ec2.CfnTransitGateway(this, 'tgw');
        new ec2.CfnTransitGatewayAttachment(this, 'tgwVpcAttachment', {
            subnetIds: vpc.publicSubnets.map(publicSubnets => publicSubnets.subnetId),
            transitGatewayId: tgw.ref,
            vpcId: vpc.vpcId,
        });
        new ec2.CfnVPNConnection(this, 'vpnConnection', {
            customerGatewayId: cgw.ref,
            type: 'ipsec.1',
            transitGatewayId: tgw.ref
        });

        (vpc.publicSubnets[0] as ec2.Subnet).addRoute("StaticRoute", {
            routerId: tgw.ref,
            routerType: ec2.RouterType.GATEWAY,
            destinationCidrBlock: destinationCidrBlock
        });
        (vpc.publicSubnets[1] as ec2.Subnet).addRoute("StaticRoute", {
            routerId: tgw.ref,
            routerType: ec2.RouterType.GATEWAY,
            destinationCidrBlock: destinationCidrBlock
        });


        new ec2.InterfaceVpcEndpoint(this, 'VPC Endpoint', {
            vpc: vpc,
            service: new ec2.InterfaceVpcEndpointService(vpceId, 80),
            // Choose which availability zones to place the VPC endpoint in, based on
            // available AZs
            // subnets: {
            //   availabilityZones: ['us-east-1a', 'us-east-1c']
            // }
        });

        //####### Const #######//

        //Change this to EC2 Key Pair name
        const ec2KeyName = 'ap2';
        // Node server for EC2
        const nodeServer =
            'https://gist.githubusercontent.com/msimpsonnz/0a1665b6c83bc10067ca7d44b5b1906b/raw/acb0b7ea30c8330190df1d395866bbf58a31756b/echoHeadersNode';


        const transitInstanceSG = new ec2.SecurityGroup(
            this,
            'transitInstanceSG',
            {
                vpc: vpc,
                securityGroupName: 'transitInstanceSG',
                description: 'Allow port 80',
                allowAllOutbound: true,
            }
        );
        transitInstanceSG.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(80),
            'allow public http access'
        );

        const transitInstance_ec2UserData = ec2.UserData.forLinux();
        transitInstance_ec2UserData.addCommands(
            'yum install -y gcc-c++ make',
            'curl -sL https://rpm.nodesource.com/setup_14.x | sudo -E bash -',
            'yum install -y nodejs',
            'mkdir /opt/node',
            `curl ${nodeServer} -o /opt/node/server.js`,
            'command node /opt/node/server.js &'
        );

        const transitInstance = new ec2.Instance(this, 'transitInstance', {
            instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.NANO
            ),
            machineImage: new ec2.AmazonLinuxImage({
                generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
            }),
            vpc: vpc,
            securityGroup: transitInstanceSG,
            keyName: ec2KeyName,
            userData: transitInstance_ec2UserData,
        });

    }
}