#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkPipelinesStack } from '../lib/cdk-pipelines-stack';

const app = new cdk.App();
new CdkPipelinesStack(app, 'CdkPipelinesStack', {
    env: {
        account: '123456789012',
        region: 'eu-west-1',
      }
});
