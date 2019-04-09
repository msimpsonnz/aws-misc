#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/cdk');
import { BlogServiceStack } from '../lib/blog_service-stack';

const app = new cdk.App();
new BlogServiceStack(app, 'BlogServiceStack');