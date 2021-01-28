#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AppsyncAuroraStack } from '../lib/appsync-aurora-stack';

const app = new cdk.App();
new AppsyncAuroraStack(app, 'AppsyncAuroraStack', {
    env: {
        region: 'ap-southeast-2'//'us-east-1'
    }
});
