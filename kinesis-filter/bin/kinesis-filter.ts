#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { KinesisFilterStack } from '../lib/kinesis-filter-stack';

const app = new cdk.App();
new KinesisFilterStack(app, 'KinesisFilterStack');
