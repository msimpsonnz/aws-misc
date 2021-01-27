#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CfFwdStack } from '../lib/cf-fwd-stack';

const app = new cdk.App();
new CfFwdStack(app, 'CfFwdStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-east-1'
    }
});
