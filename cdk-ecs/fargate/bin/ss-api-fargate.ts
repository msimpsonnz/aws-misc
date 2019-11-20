#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { SsApiFargateStack } from '../lib/ss-api-fargate-stack';

const app = new cdk.App();
new SsApiFargateStack(app, 'ss-api-fargate-stack', {
    env: {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.CDK_DEFAULT_REGION
        }   
    }
);
