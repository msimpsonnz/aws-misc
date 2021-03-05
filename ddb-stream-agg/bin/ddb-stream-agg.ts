#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DdbStreamAggStack } from '../lib/ddb-stream-agg-stack';

const app = new cdk.App();
new DdbStreamAggStack(app, 'DdbStreamAggStack');
