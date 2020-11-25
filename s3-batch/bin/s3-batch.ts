#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { S3BatchStack } from '../lib/s3-batch-stack';

const app = new cdk.App();
new S3BatchStack(app, 'S3BatchStack');
