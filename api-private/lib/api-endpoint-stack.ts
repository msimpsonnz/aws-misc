import {
  aws_apigateway as apigateway,
  aws_certificatemanager as certificatemanager,
  aws_ec2 as ec2,
  aws_elasticloadbalancingv2 as elasticloadbalancingv2,
  aws_elasticloadbalancingv2_targets as elasticloadbalancingv2_targets,
  aws_lambda as lambda,
  aws_route53 as route53,
  Stack,
  StackProps
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DomainName, HttpApi } from '@aws-cdk/aws-apigatewayv2-alpha';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';

export class ApiEndpointStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Constants
    const domainName = 'dev.simpsnm.people.aws.dev';
    const apiDomainName = `api.${domainName}`;
    const eip1 = '10.0.2.59';
    const eip2 = '10.0.3.117';

    // VPC
    const vpc = new ec2.Vpc(this, 'vpc', {
      cidr: '10.0.0.0/21',
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
      ],
      maxAzs: 2,
      natGateways: 1
    });

    // Security Group
    const sg_fn = new ec2.SecurityGroup(this, 'sg_fn', {
      description: 'sg_fn',
      vpc,
      allowAllOutbound: true
    });

    const sg_alb = new ec2.SecurityGroup(this, 'sg_alb', {
      description: 'sg_alb',
      vpc,
      allowAllOutbound: false
    });
    sg_alb.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow outbound access - HTTPS')

    // Allow Lambda to access ALB
    sg_alb.connections.allowFrom(new ec2.Connections({
      securityGroups: [sg_fn]
    }),
      ec2.Port.tcp(443),
      'Allow Lambda to access ALB'
    );

    // Add VPC Enpoint
    const endpoint_api_internal = new ec2.InterfaceVpcEndpoint(this, 'endpoint_api_internal', {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
      },
      privateDnsEnabled: false,
      securityGroups: [
        sg_alb
      ]
    });

    // Route53
    const zone = route53.HostedZone.fromHostedZoneId(this, 'zone', 'Z036911133KLHE4Z6V31Y');

    // Certificate Manager
    const cert_api_internal = new certificatemanager.Certificate(this, 'cert_api_internal', {
      domainName: apiDomainName,
      validation: certificatemanager.CertificateValidation.fromDns(zone),
    });

    // Lambda Echo
    const fnEcho = new lambda.Function(this, 'fnEcho', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
      exports.handler = async function (event) {
          console.log(JSON.stringify(event));
          return event;
      }
      `)
    });

    const alb = new elasticloadbalancingv2.ApplicationLoadBalancer(this, 'alb', {
      vpc,
      internetFacing: false,
      securityGroup: sg_alb
    });

    const listener = alb.addListener('Listener', {
      port: 443,
      certificates: [cert_api_internal],
    });

    listener.addTargets('Targets', {
      port: 443,
      protocol: elasticloadbalancingv2.ApplicationProtocol.HTTPS,
      targets: [
        new elasticloadbalancingv2_targets.IpTarget(eip1),
        new elasticloadbalancingv2_targets.IpTarget(eip2)
      ],
    });

    // Internal API
    const dn = new DomainName(this, 'DN', {
      domainName: apiDomainName,
      certificate: cert_api_internal,
    });

    const api_internal = new HttpApi(this, 'HttpProxyProdApi', {
      defaultIntegration: new LambdaProxyIntegration({ handler: fnEcho }),
      defaultDomainMapping: {
        domainName: dn
      },
    });


    // Public API
    const publicApi = new apigateway.RestApi(this, 'publicApi');

    publicApi.root.addResource('foo').addMethod('GET', new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseTemplates: {
          "application/json": `{
                "id": "$context.requestId",
                "createdAt": $context.requestTimeEpoch,
                "updatedAt": $context.requestTimeEpoch
            }`
        }
      }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': '{ "statusCode": 200 }',
      },
    }), {
      methodResponses: [{ statusCode: '200' }],
    });

    // Lambda
    const fnTester = new lambda.Function(this, 'fnTester', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      vpc,
      environment: {
        INTERNAL_API: `https://${apiDomainName}/foo`,
        INTERNAL_API_ID: api_internal.apiId,
        PUBLIC_API: `${publicApi.url}foo`
      },
      code: lambda.Code.fromInline(`
      const https = require('https');
      const dns = require('dns');
      
      exports.handler = async function (event) {
          console.log(JSON.stringify(event));
          let final = [];
          dnsPromises = dns.promises;
          //Internal
          const internalUrl = new URL(process.env.INTERNAL_API);
          const internalIp = await dnsPromises.lookup(internalUrl.hostname);
          const httpsOptionsInternal = {
              hostname: internalUrl.hostname,
              port: 443,
              path: internalUrl.pathname,
              method: 'GET',
              headers: {
                x-apigw-api-id: process.env.INTERNAL_API_ID
              }
          };
          const internalRes = await makeRequest(httpsOptionsInternal);
          final.push({
              internal: {
                  api: internalUrl.origin,
                  apiIp: internalIp.address,
                  result: internalRes
              }
          });
      
          //Public
          const publicUrl = new URL(process.env.PUBLIC_API);
          const publicIp = await dnsPromises.lookup(publicUrl.hostname);
          const httpsOptionsPublic = {
              hostname: publicUrl.hostname,
              port: 443,
              path: publicUrl.pathname,
              method: 'GET',
          };
          const publicRes = await makeRequest(httpsOptionsPublic);
          final.push({
              public: {
                  api: publicUrl.origin,
                  apiIp: publicIp.address,
                  result: publicRes
              }
          });
          return console.log(JSON.stringify(final));
      
      }
      function makeRequest(options) {
          return new Promise((resolve, reject) => {
              const req = https.get(options, (res) => {
                  res.setEncoding('utf8');
                  let responseBody = '';
      
                  res.on('data', (chunk) => {
                      responseBody += chunk;
                  });
      
                  res.on('end', () => {
                      resolve(JSON.parse(responseBody));
                  });
              });
      
              req.on('error', (err) => {
                  reject(err);
              });
      
              req.end();
          });
      }
      `),
    });

  }
}
