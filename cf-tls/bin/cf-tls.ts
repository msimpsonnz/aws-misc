#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CfTlsStack } from '../lib/cf-tls-stack';

const app = new cdk.App();
new CfTlsStack(app, 'CfTlsStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-east-1'//process.env.CDK_DEFAULT_REGION
    }
});
