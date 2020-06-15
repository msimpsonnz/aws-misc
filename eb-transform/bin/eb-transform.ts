#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { EbTransformStack } from '../lib/eb-transform-stack';

const app = new cdk.App();
new EbTransformStack(app, 'EbTransformStack');
