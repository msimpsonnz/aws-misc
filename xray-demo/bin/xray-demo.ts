#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { XrayDemoStack } from '../lib/xray-demo-stack';

const app = new cdk.App();
new XrayDemoStack(app, 'XrayDemoStack');
