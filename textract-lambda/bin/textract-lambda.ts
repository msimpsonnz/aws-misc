#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { TextractLambdaStack } from '../lib/textract-lambda-stack';

const app = new cdk.App();
new TextractLambdaStack(app, 'TextractLambdaStack');
