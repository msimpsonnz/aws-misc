#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { CdkStack } from '../lib/cdk-stack';

const app = new cdk.App();
new CdkStack(app, 'dms-stream-stack', {
    env: {
		account: process.env.CDK_DEFAULT_ACCOUNT,
		region: 'us-east-1'
    }
});
