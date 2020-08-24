#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CwCanaryUiStack } from '../lib/cw-canary-ui-stack';

const app = new cdk.App();
new CwCanaryUiStack(app, 'CwCanaryUiStack');
