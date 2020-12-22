#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SlsInfraStack } from '../lib/sls-infra-stack';

const app = new cdk.App();
new SlsInfraStack(app, 'SlsInfraStack');
