#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { EventRecievingStack } from '../lib/event-recieving-stack';
import { EventSendingStack } from '../lib/event-sending-stack';

const app = new cdk.App();
const sendingAccountId = app.node.tryGetContext('sendingAccountId');
const recievingAccountId = app.node.tryGetContext('recievingAccountId');

new EventRecievingStack(app, 'EventRecievingStack', {
    sendingAccountId: sendingAccountId,
    env: {
        account: recievingAccountId
    }
});
new EventSendingStack(app, 'EventSendingStack', {
    recievingAccountId: recievingAccountId,
    env: {
        account: sendingAccountId
    }
});
