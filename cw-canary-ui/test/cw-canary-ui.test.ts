import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as CwCanaryUi from '../lib/cw-canary-ui-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new CwCanaryUi.CwCanaryUiStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
