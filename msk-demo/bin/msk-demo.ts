#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { MskDemoStack } from '../lib/msk-demo-stack';

const app = new cdk.App();
new MskDemoStack(app, 'MskDemoStack');
