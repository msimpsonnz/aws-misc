#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SqsFifoSingleStack } from '../lib/sqs-fifo-single-stack';

const app = new cdk.App();
new SqsFifoSingleStack(app, 'SqsFifoSingleStack');
