#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { IotJobQueueStack } from '../lib/iot-job-queue-stack';

const app = new cdk.App();
new IotJobQueueStack(app, 'IotJobQueueStack');
