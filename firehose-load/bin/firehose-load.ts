#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { FirehoseLoadStack } from '../lib/firehose-load-stack';

const app = new cdk.App();
new FirehoseLoadStack(app, 'FirehoseLoadStack');
