#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/cdk');
import { CdkAlbStack } from '../lib/cdk-alb-stack';

const app = new cdk.App();
new CdkAlbStack(app, 'AlbStack');
