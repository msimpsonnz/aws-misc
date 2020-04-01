import * as cdk from "@aws-cdk/core";
import { Function, Runtime, AssetCode } from "@aws-cdk/aws-lambda";
import {
  RestApi,
  TokenAuthorizer,
  LambdaIntegration
} from "@aws-cdk/aws-apigateway";
import elbv2 = require("@aws-cdk/aws-elasticloadbalancingv2");
import targets = require("@aws-cdk/aws-elasticloadbalancingv2-targets");
import { Vpc, SubnetType } from "@aws-cdk/aws-ec2";

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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

    const storageFn = new Function(this, "storageFn", {
      runtime: Runtime.DOTNET_CORE_2_1,
      code: new AssetCode(
        "../func/auth/src/auth/bin/Release/netcoreapp3.1/auth.zip"
      ),
      handler: "auth::auth.Functions::Get",
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {}
    });

    const apiIdSrv = new LambdaIntegration(idSrvFn);

    const api = new RestApi(this, "api");

    const apiIdSrvResource = api.root.addResource("id");

    apiIdSrvResource.addMethod("GET", new LambdaIntegration(idSrvFn));

    const apiAuth = new TokenAuthorizer(this, "storageAuthorizer", {
      handler: authFn
    });

    const apiStorageResource = api.root.addResource("storage");

    apiStorageResource.addMethod("GET", new LambdaIntegration(idSrvFn), {
      authorizer: apiAuth
    });
  }
}
