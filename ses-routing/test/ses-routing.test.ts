import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as SesRouting from '../lib/ses-routing-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new SesRouting.SesRoutingStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
