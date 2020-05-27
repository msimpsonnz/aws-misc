#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { LambdaEmfStack } from '../lib/lambda-emf-stack';

const app = new cdk.App();
new LambdaEmfStack(app, 'LambdaEmfStack');
