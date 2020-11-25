#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { MqDemoStack } from '../lib/mq-demo-stack';

const app = new cdk.App();
new MqDemoStack(app, 'MqDemoStack', {
    env: {
        account: '383358879677',
        region: 'ap-southeast-2'
    }
});
