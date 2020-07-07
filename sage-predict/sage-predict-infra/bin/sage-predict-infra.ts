#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SagePredictInfraStack } from '../lib/sage-predict-infra-stack';

const app = new cdk.App();
new SagePredictInfraStack(app, 'SagePredictInfraStack');
