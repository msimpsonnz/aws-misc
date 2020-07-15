#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { RDSProxyStack } from '../lib/secret-rds-stack';

const app = new cdk.App();
new RDSProxyStack(app, 'RDSProxyStack', {
    env: {
        account: '383358879677',
        region: 'ap-southeast-2',
    }
});
