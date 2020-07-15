#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ApiStackStack } from '../lib/api-stack-stack';

const app = new cdk.App();
new ApiStackStack(app, 'ApiStackStack');
