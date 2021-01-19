#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DdbQueryStack } from '../lib/ddb-query-stack';

const app = new cdk.App();
new DdbQueryStack(app, 'DdbQueryStack');
