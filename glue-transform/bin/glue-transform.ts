#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { GlueTransformStack } from '../lib/glue-transform-stack';

const app = new cdk.App();
new GlueTransformStack(app, 'GlueTransformStack');
