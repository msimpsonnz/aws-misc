#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkLambdaNodeStack } from '../lib/cdk-lambda-node-stack';

const app = new cdk.App();
new CdkLambdaNodeStack(app, 'CdkLambdaNodeStack');
