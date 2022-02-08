#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TgwVpnServiceStack } from '../lib/tgw-vpn-service-stack';
import { TgwVpnCustomerStack } from '../lib/tgw-vpn-customer-stack';
import { TgwVpnTransitStack } from '../lib/tgw-vpn-transit-stack';

const app = new cdk.App();
new TgwVpnServiceStack(app, 'TgwVpnServiceStack');
new TgwVpnCustomerStack(app, 'TgwVpnCustomerStack');
new TgwVpnTransitStack(app, 'TgwVpnTransitStack');
