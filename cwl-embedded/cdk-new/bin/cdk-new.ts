#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkNewStack } from '../lib/cdk-new-stack';

const app = new cdk.App();
new CdkNewStack(app, 'CdkNewStack');
