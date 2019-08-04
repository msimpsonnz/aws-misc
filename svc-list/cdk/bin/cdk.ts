#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { CdkStack } from '../lib/cdk-stack';
//import { CrossRegionScaffolding } from '@aws-cdk/aws-codepipeline';

const app = new cdk.App();
new CdkStack(app, 'servicelist-cdk-stack', {
    env: {
        region: 'ap-southeast-2'
    }
});
