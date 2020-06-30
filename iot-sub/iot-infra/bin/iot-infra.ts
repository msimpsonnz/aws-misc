#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { IotInfraStack } from '../lib/iot-infra-stack';

const app = new cdk.App();
new IotInfraStack(app, 'IotInfraStack');
