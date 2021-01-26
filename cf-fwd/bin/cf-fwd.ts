#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CfFwdStack } from '../lib/cf-fwd-stack';

const app = new cdk.App();
new CfFwdStack(app, 'CfFwdStack');
