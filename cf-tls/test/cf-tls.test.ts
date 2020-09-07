import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as CfTls from '../lib/cf-tls-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new CfTls.CfTlsStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
