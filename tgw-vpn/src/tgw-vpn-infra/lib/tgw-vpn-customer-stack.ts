import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    aws_iam as iam,
    aws_ec2 as ec2
} from 'aws-cdk-lib';

export class TgwVpnCustomerStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        //--- Customer ---//
        // Customer - VPC
        const customerVpc = new ec2.Vpc(this, 'customerVpc', {
            cidr: '10.10.1.0/24',
            maxAzs: 2,
            subnetConfiguration: [
                {
                    name: 'customer',
                    subnetType: ec2.SubnetType.PUBLIC,
                },
            ],
        });


        const customerInstanceSG = new ec2.SecurityGroup(
            this,
            'customerInstanceSG',
            {
                vpc: customerVpc,
                securityGroupName: 'customerInstanceSG',
                description: 'Allow port 80',
                allowAllOutbound: true,
            }
        );

        const customerInstance = new ec2.Instance(this, 'customerInstance', {
            instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.NANO
            ),
            machineImage: new ec2.AmazonLinuxImage({
                generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
            }),
            vpc: customerVpc,
            securityGroup: customerInstanceSG,
            keyName: 'ap2'
        });

    }
}