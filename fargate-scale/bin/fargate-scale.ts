#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { FargateScaleStack } from '../lib/fargate-scale-stack';

const app = new cdk.App();
new FargateScaleStack(app, 'FargateScaleStack');
