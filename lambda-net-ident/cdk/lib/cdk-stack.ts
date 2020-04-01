import * as cdk from "@aws-cdk/core";
import iam = require("@aws-cdk/aws-iam");
import { Bucket } from "@aws-cdk/aws-s3";
import { BucketDeployment, Source } from "@aws-cdk/aws-s3-deployment";
import { Function, Runtime, AssetCode } from "@aws-cdk/aws-lambda";
import {
  RestApi,
  TokenAuthorizer,
  LambdaIntegration
} from "@aws-cdk/aws-apigateway";
import elbv2 = require("@aws-cdk/aws-elasticloadbalancingv2");
import targets = require("@aws-cdk/aws-elasticloadbalancingv2-targets");
import { Vpc, SubnetType } from "@aws-cdk/aws-ec2";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const demoBucket = new Bucket(this, "demoBucket", {
      bucketName: "mjs-signedurl-demo"
    });

    new BucketDeployment(this, "bucketContent", {
      sources: [Source.asset("../misc")],
      destinationBucket: demoBucket,
      destinationKeyPrefix: 'images' // optional prefix in destination bucket
    });

    const idSrvFn = new Function(this, "idSrvFn", {
      runtime: Runtime.DOTNET_CORE_2_1,
      code: new AssetCode(
        "../func/idsrv/src/idsrv/bin/Release/netcoreapp3.1/idsrv.zip"
      ),
      handler:
        "IdentityServer4Demo::IdentityServer4Demo.LambdaEntryPoint::FunctionHandlerAsync",
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {}
    });

    const vpc = new Vpc(this, "idsrv-vpc", {
      cidr: "10.0.0.0/16",
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "publicSubnet",
          subnetType: SubnetType.PUBLIC
        }
      ],
      natGateways: 0
    });

    const lb = new elbv2.ApplicationLoadBalancer(this, "LB", {
      vpc,
      internetFacing: true
    });

    const listener = lb.addListener("Listener", { port: 80 });
    listener.addTargets("Targets", {
      targets: [new targets.LambdaTarget(idSrvFn)]
    });

    const authFn = new Function(this, "authFn", {
      runtime: Runtime.DOTNET_CORE_2_1,
      code: new AssetCode(
        "../func/auth/src/auth/bin/Release/netcoreapp3.1/auth.zip"
      ),
      handler: "auth::auth.Functions::Get",
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        AWS_ALB_URL: `http://${lb.loadBalancerDnsName}`
      }
    });

    const getSignedUrlRole = new iam.Role(this, "getSignedUrlRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com")
    });

    getSignedUrlRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));

    getSignedUrlRole.addToPolicy(
      new iam.PolicyStatement({
        resources: [`${demoBucket.bucketArn}/images/*`],
        actions: ["s3:GetObject"]
      })
    );

    const getSignedUrlFunction = new NodejsFunction(this, 'getSignedUrlFunction', {
        entry: '../func/getSignedUrlFunction/index.ts',
        handler: 'handler',
        runtime: Runtime.NODEJS_12_X,
        role: getSignedUrlRole,
        environment: {
          AWS_S3_BUCKET_NAME: demoBucket.bucketName
        }
    });

    const api = new RestApi(this, "api");

    const apiAuth = new TokenAuthorizer(this, "storageAuthorizer", {
      handler: authFn
    });

    const apiStorageResource = api.root.addResource("storage");

    apiStorageResource.addMethod("GET", new LambdaIntegration(getSignedUrlFunction), {
      authorizer: apiAuth
    });
  }
}
