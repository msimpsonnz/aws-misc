import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as route53 from '@aws-cdk/aws-route53';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as origins from '@aws-cdk/aws-cloudfront-origins';
import * as targets from '@aws-cdk/aws-route53-targets';

export class CfFwdStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //Change this to EC2 Key Pair name in us-east-1
    const ec2KeyName = 'us-east';
    //Change this to Route53 hosted zone you control
    const myDomainName = 'demo.msimpson.co.nz';
    // Node server for EC2
    const nodeServer = "https://gist.githubusercontent.com/msimpsonnz/0a1665b6c83bc10067ca7d44b5b1906b/raw/acb0b7ea30c8330190df1d395866bbf58a31756b/echoHeadersNode"
    //Enable SSH to EC2 if required
    const enableSSH = false;

    const vpc = new ec2.Vpc(this, 'vpc', {
      cidr: `10.0.0.0/21`,
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'Ingress',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const nginxSecurityGroup = new ec2.SecurityGroup(
      this,
      'nginxSecurityGroup',
      {
        vpc,
        securityGroupName: 'nginxSecurityGroup',
        description: 'Allow port 80',
        allowAllOutbound: true,
      }
    );
    nginxSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'allow public http access'
    );
    if (enableSSH) {
      nginxSecurityGroup.addIngressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(22),
        'allow public ssh access'
      );
    }

    const ec2UserData = ec2.UserData.forLinux();
    ec2UserData.addCommands(
      'yum install -y gcc-c++ make',
      'curl -sL https://rpm.nodesource.com/setup_14.x | sudo -E bash -',
      'yum install -y nodejs',
      'mkdir /opt/node',
      `curl ${nodeServer} -o /opt/node/server.js`,
      'command node /opt/node/server.js &'
    );

    const nginx = new ec2.Instance(this, 'ec2nginx', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.NANO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      vpc: vpc,
      securityGroup: nginxSecurityGroup,
      keyName: ec2KeyName,
      userData: ec2UserData
    });

    const myHostedZone = route53.HostedZone.fromLookup(this, 'myHostedZone', {
      domainName: myDomainName,
    });

    const cfRecordName = 'cf-fwd';
    const cfDomainName = `${cfRecordName}.${myDomainName}`;

    const cfCert = new acm.Certificate(this, 'cfCert', {
      domainName: cfDomainName,
      validation: acm.CertificateValidation.fromDns(myHostedZone),
    });


    // const myCachePolicy = new cloudfront.CachePolicy(this, 'myCachePolicy', {
    //   cachePolicyName: 'CacheAllowHostPolicy',
    //   comment: 'Cache policy for host forwarding',
    //   headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Host'),
    // });

    const myOriginRequestPolicy = new cloudfront.OriginRequestPolicy(
      this,
      'OriginRequestPolicy',
      {
        originRequestPolicyName: 'OriginReqAllowHostPolicy',
        comment: 'Policy to allow host forwarding to origin',
        headerBehavior: cloudfront.OriginRequestHeaderBehavior.allowList(
          'Host'
        ),
      }
    );

    const cfDistWithCustomPolicy = new cloudfront.Distribution(this, 'myDistWithCustomPolicy', {
      defaultBehavior: {
        origin: new origins.HttpOrigin(nginx.instancePublicDnsName, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY, //Just for testing
        }),
        //cachePolicy: myCachePolicy,
        originRequestPolicy: myOriginRequestPolicy,
      },
      domainNames: [cfDomainName],
      certificate: cfCert,
    });

    new route53.ARecord(this, 'cname', {
      recordName: cfRecordName,
      zone: myHostedZone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(cfDistWithCustomPolicy))
    });
  }
}
