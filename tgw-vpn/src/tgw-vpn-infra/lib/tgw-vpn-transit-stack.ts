import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    aws_iam as iam,
    aws_ec2 as ec2
} from 'aws-cdk-lib';

export class TgwVpnTransitStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const vpceId = 'com.amazonaws.vpce.ap-southeast-2.vpce-svc-0d24112409ae213e5';
        const cgwIp = '52.62.6.248';
        //--- Transit ---//

        const transitVpc = new ec2.Vpc(this, 'transitVpc', {
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
            subnetIds: transitVpc.publicSubnets.map(publicSubnets => publicSubnets.subnetId),
            transitGatewayId: tgw.ref,
            vpcId: transitVpc.vpcId,
        });
        new ec2.CfnVPNConnection(this, 'vpnConnection', {
            customerGatewayId: cgw.ref,
            type: 'ipsec.1',
            transitGatewayId: tgw.ref
        })


        new ec2.InterfaceVpcEndpoint(this, 'VPC Endpoint', {
            vpc: transitVpc,
            service: new ec2.InterfaceVpcEndpointService(vpceId, 80),
            // Choose which availability zones to place the VPC endpoint in, based on
            // available AZs
            // subnets: {
            //   availabilityZones: ['us-east-1a', 'us-east-1c']
            // }
        });

    }
}