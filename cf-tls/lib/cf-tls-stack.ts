import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as lambda from '@aws-cdk/aws-lambda';
import * as route53 from '@aws-cdk/aws-route53';
import * as r53targets from '@aws-cdk/aws-route53-targets';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as targets from '@aws-cdk/aws-elasticloadbalancingv2-targets';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as origins from '@aws-cdk/aws-cloudfront-origins';

export class CfTlsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'vpc', {
      cidr: `10.0.0.0/21`,
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'Ingress',
          subnetType: ec2.SubnetType.PUBLIC,
        }
      ],
    });



    const fn = new lambda.Function(this, 'cf-tls-lambda', {
      code: lambda.Code.fromInline(`
        exports.handler = async function(event) { 
          console.log(JSON.stringify(event));
          const response = {
            statusCode: 200,
            statusDescription: "200 OK",
            isBase64Encoded: false,
            headers: { 
              "Content-Type": "text/html"
            },
            body: "<h1>Hello from Lambda!</h1>"
          }
          return response;
        }
      `),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      vpc: vpc,
      allowPublicSubnet: true,
    });

    const zone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'devlabnz.net',
    });

    const albcert = new acm.Certificate(this, 'AlbCertificate', {
      domainName: 'alb.devlabnz.net',
      validation: acm.CertificateValidation.fromDns(zone),
    });


    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true
    });

    const listener = lb.addListener('Listener', {
      port: 443,
      certificates: [albcert],
    });

    listener.addTargets('Targets', {
      targets: [new targets.LambdaTarget(fn)],
    });

    new route53.ARecord(this, 'AlbAliasRecord', {
      zone,
      target: route53.RecordTarget.fromAlias(new r53targets.LoadBalancerTarget(lb)),
      recordName: 'alb'
    });

    const cfcert = new acm.Certificate(this, 'CfCertificate', {
      domainName: 'tls.devlabnz.net',
      validation: acm.CertificateValidation.fromDns(zone),
    });

    const cfdist = new cloudfront.Distribution(this, 'myDist', {
      defaultBehavior: { origin: new origins.HttpOrigin('alb.devlabnz.net') },
      domainNames: ['tls.devlabnz.net'],
      certificate: cfcert,
    });

    new route53.ARecord(this, 'CfAliasRecord', {
      zone,
      target: route53.RecordTarget.fromAlias(new r53targets.CloudFrontTarget(cfdist)),
      recordName: 'tls'
    });


  }
}
