#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/cdk');
import { AppStreamStack, WebStack, VpcPeerStack } from '../lib/cdk-stack';
//import { Vpc } from '@aws-cdk/aws-ec2';

const user = 'm.simpson@outlook.com'

const app = new cdk.App();


const webStack = new WebStack(app, 'WebStack', {
    env: {
        region: 'ap-southeast-2'
    }
})

const appStreamStack = new AppStreamStack(app, 'CdkStack', { 
    env: {
        region: 'ap-southeast-2'
    },
    userName: user 
});

new VpcPeerStack(app, 'AppPeerStack', { 
    env: {
        region: 'ap-southeast-2'
    },
    peerName: 'AppToWebPeer',
    peerRegion: 'ap-southeast-2',
    peerVpcId: webStack.vpc.vpcId,
    vpcId: appStreamStack.vpc.vpcId
});

new VpcPeerStack(app, 'WebPeerStack', { 
    env: {
        region: 'ap-southeast-2'
    },
    peerName: 'WebToAppPeer',
    peerRegion: 'ap-southeast-2',
    peerVpcId: appStreamStack.vpc.vpcId,
    vpcId: webStack.vpc.vpcId
});