#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { EsKnnStack } from '../lib/es-knn-stack';

const app = new cdk.App();
new EsKnnStack(app, 'EsKnnStack');
