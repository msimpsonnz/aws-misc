#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/cdk');
import { AppStreamStack, WebStack, VpcPeerStack } from '../lib/cdk-stack';

const app = new cdk.App();

new WebStack(app, 'WebStack', {
    env: {
        region: 'ap-southeast-1'
    }
});

new AppStreamStack(app, 'AppStack', { 
    env: {
        region: 'ap-southeast-2'
    },
    userName: 'm.simpson@outlook.com'
});

new VpcPeerStack(app, 'VpcPeerStack', { 
    autoDeploy: false,
    env: {
        region: 'ap-southeast-2'
    },
    peerName: 'AppToWebPeer',
    peerRegion: 'ap-southeast-1',
    peerVpcId: 'vpc-07668b8d197994bd2',
    vpcId: 'vpc-08502e391a04c06dd'
});