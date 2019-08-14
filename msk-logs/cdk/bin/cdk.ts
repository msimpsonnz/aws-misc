#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { CdkStack } from '../lib/cdk-stack';

let envRegion = process.env["CDK_AWS_REGION"];
let envAccount = process.env["CDK_AWS_ACCOUNT"];

const app = new cdk.App();
new CdkStack(app, 'msk-demo-stack', {
    env: {
        region: envRegion,
        account: envAccount
    }
});
