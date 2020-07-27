#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { RDSProxyStack } from '../lib/secret-rds-stack';

const app = new cdk.App();
const environment = app.node.tryGetContext("environment");
new RDSProxyStack(app, `RDSProxyStack${environment}`, {
    env: {
        account: '383358879677',
        region: 'ap-southeast-2',
    }
});
