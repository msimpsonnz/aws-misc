#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SesRoutingStack } from '../lib/ses-routing-stack';

const app = new cdk.App();
new SesRoutingStack(app, 'SesRoutingStack-us-east-1', {
    env: {
        region: 'us-east-1'
    }
});
new SesRoutingStack(app, 'SesRoutingStack-us-west-2', {
    env: {
        region: 'us-west-2'
    }
});
