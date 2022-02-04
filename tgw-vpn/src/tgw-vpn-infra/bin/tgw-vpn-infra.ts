#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TgwVpnInfraStack } from '../lib/tgw-vpn-infra-stack';
import { TgwVpnCustomerStack } from '../lib/tgw-vpn-customer-stack';
import { TgwVpnTransitStack } from '../lib/tgw-vpn-transit-stack';

const app = new cdk.App();
new TgwVpnInfraStack(app, 'TgwVpnInfraStack');
new TgwVpnCustomerStack(app, 'TgwVpnCustomerStack');
new TgwVpnTransitStack(app, 'TgwVpnTransitStack');
