#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SecretRdsStack } from '../lib/secret-rds-stack';

const app = new cdk.App();
new SecretRdsStack(app, 'SecretRdsStack', {
    env: {
        account: '383358879677',
        region: 'ap-southeast-2',
    }
});
