#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { KinesisDemoStack } from '../lib/kinesis-demo-stack';

const app = new cdk.App();
new KinesisDemoStack(app, 'KinesisDemoStack');
