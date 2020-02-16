#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { ApiFargateStack } from '../lib/api-fargate-stack';

const app = new cdk.App();
const environment = app.node.tryGetContext("environment");
new SsApiFargateStack(app, `ss-api-${environment}`, {
    env: {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.CDK_DEFAULT_REGION
        }   
    }
);
