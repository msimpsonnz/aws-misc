import * as cdk from '@aws-cdk/core';
//import * as ec2 from '@aws-cdk/aws-ec2';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as origins from '@aws-cdk/aws-cloudfront-origins';

export class CfFwdStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // const vpc = new ec2.Vpc(this, 'vpc', {
    //   cidr: `10.0.0.0/21`,
    //   maxAzs: 2,
    //   subnetConfiguration: [
    //     {
    //       name: 'Ingress',
    //       subnetType: ec2.SubnetType.PUBLIC,
    //     }
    //   ],
    // });

    // const nginxSecurityGroup = new ec2.SecurityGroup(this, 'nginxSecurityGroup', {
    //   vpc,
    //   securityGroupName: "nginxSecurityGroup",
    //   description: 'Allow port 80',
    //   allowAllOutbound: true 
    // });
    // nginxSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'allow public http access')
    // nginxSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow public ssh access')

    // const nginx = new ec2.Instance(this, 'ec2nginx', {
    //   instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
    //   machineImage: new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }),
    //   vpc: vpc,
    //   securityGroup: nginxSecurityGroup,
    //   keyName: 'ap2'
    // });

    // nginx.addUserData("sudo yum update -y\r\nsudo yum install nginx\r\nsudo nginx")

    //Change this to origin
    const myOrigin = 'ec2-3-24-124-63.ap-southeast-2.compute.amazonaws.com';

    const myCachePolicy = new cloudfront.CachePolicy(this, 'myCachePolicy', {
      cachePolicyName: 'CacheAllowHostPolicy',
      comment: 'Cache policy for host forwarding',
      defaultTtl: cdk.Duration.days(2),
      minTtl: cdk.Duration.minutes(1),
      maxTtl: cdk.Duration.days(10),
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Host'),
    });

    const myOriginRequestPolicy = new cloudfront.OriginRequestPolicy(this, 'OriginRequestPolicy', {
      originRequestPolicyName: 'OriginReqAllowHostPolicy',
      comment: 'Policy to allow host forwarding to origin',
      headerBehavior: cloudfront.OriginRequestHeaderBehavior.allowList('Host'),
    });

    new cloudfront.Distribution(this, 'myDistWithCustomPolicy', {
      defaultBehavior: {
        //origin: new origins.HttpOrigin(nginx.instancePublicDnsName),
        origin: new origins.HttpOrigin(myOrigin),
        cachePolicy: myCachePolicy,
        originRequestPolicy: myOriginRequestPolicy
      },
    });

  }
}
