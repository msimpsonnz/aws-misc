#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DdbPrivateApiStack } from '../lib/ddb-private-api-stack';

const app = new cdk.App();
new DdbPrivateApiStack(app, 'DdbPrivateApiStack');
