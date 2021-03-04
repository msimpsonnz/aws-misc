#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { KinesisAnalyticsLambdaStack } from '../lib/kinesis-analytics-lambda-stack';

const app = new cdk.App();
new KinesisAnalyticsLambdaStack(app, 'KinesisAnalyticsLambdaStack');
