#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { EvbAhaStack } from '../lib/evb-aha-stack';

const app = new cdk.App();
new EvbAhaStack(app, 'EvbAhaStack');
