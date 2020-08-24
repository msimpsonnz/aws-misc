#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CfSignedStack } from '../lib/cf-signed-stack';

const app = new cdk.App();
new CfSignedStack(app, 'CfSignedStack', {
    env: {
        region: 'us-east-1'
    }
    
});
