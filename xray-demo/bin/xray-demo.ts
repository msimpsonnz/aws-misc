#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { XrayDemoPipeline } from '../lib/xray-demo-pipeline';

const app = new cdk.App();
new XrayDemoPipeline(app, 'XrayDemoPipeline', {
    env: { account: '383358879677', region: 'ap-southeast-2' },
  });

app.synth();

// import { XrayDemoStack } from '../lib/xray-demo-stack';

// const app = new cdk.App();
// new XrayDemoStack(app, 'XrayDemoStack');