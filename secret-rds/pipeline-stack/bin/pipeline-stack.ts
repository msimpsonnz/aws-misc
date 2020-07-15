#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PipelineStackStack } from '../lib/pipeline-stack-stack';

const app = new cdk.App();
new PipelineStackStack(app, 'PipelineStackStack');
