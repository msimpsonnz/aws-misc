//import * as dotenv from 'dotenv';
import cdk = require('@aws-cdk/core');

export class EnvironmentConfig {

    public environment: string;
    public certId: string;
    public domain: string;
    public imageName: string;
    public defaultVpc: boolean;
    public secretName: string;
    public fargateMB: number;
    public fargateCPU: number;
    public fargateReplica: number;
    public fargatePort: number;
    public rdsSecurityGroup: string;
    public albPort: number;
    public albDelay: number;
    public albHealthPath: string;
    public albHealthInterval: number;
    public fargateScaleCPU: number;
    public fargateScaleMem: number;
    public fargateScaleReq: number;

    constructor(node: cdk.ConstructNode) {

        this.environment = node.tryGetContext("environment");

        this.certId = node.tryGetContext(`${this.environment }_certId`);
        this.domain = node.tryGetContext(`${this.environment }_domain`);
        this.imageName = node.tryGetContext(`${this.environment }_imageName`);
        this.defaultVpc = node.tryGetContext(`${this.environment }_defaultVpc`);
        this.secretName = node.tryGetContext(`${this.environment }_secretName`);
        this.fargateMB = node.tryGetContext(`${this.environment }_fargateMB`);
        this.fargateCPU = node.tryGetContext(`${this.environment }_fargateCPU`);
        this.fargateReplica = node.tryGetContext(`${this.environment }_fargateReplica`);
        this.fargatePort = node.tryGetContext(`${this.environment }_fargatePort`);
        this.rdsSecurityGroup = node.tryGetContext(`${this.environment }_rdsSecurityGroup`);
        this.albPort = node.tryGetContext(`${this.environment }_albPort`);
        this.albDelay = node.tryGetContext(`${this.environment }_albDelay`);
        this.albHealthPath = node.tryGetContext(`${this.environment }_albHealthPath`);
        this.albHealthInterval = node.tryGetContext(`${this.environment }_albHealthInterval`);
        this.fargateScaleCPU = node.tryGetContext(`${this.environment }_fargateScaleCPU`);
        this.fargateScaleMem = node.tryGetContext(`${this.environment }_fargateScaleMem`);
        this.fargateScaleReq = node.tryGetContext(`${this.environment }_fargateScaleReq`);
    }
}