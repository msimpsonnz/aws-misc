#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { EcrTrackInfraStack } from '../lib/ecr-track-infra-stack';

const app = new cdk.App();
new EcrTrackInfraStack(app, 'EcrTrackInfraStack');
