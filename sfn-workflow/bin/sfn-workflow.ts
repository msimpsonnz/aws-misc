#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SfnWorkflowStack } from '../lib/sfn-workflow-stack';

const app = new cdk.App();
new SfnWorkflowStack(app, 'SfnWorkflowStack');