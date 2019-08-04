#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { CdkStack } from '../lib/cdk-stack';
import { CfnDeletionPolicy } from '@aws-cdk/core';

const app = new cdk.App();
new CdkStack(app, 'connect-auto-stack', {
    env: {
        region: 'ap-southeast-2'
    }
});
