import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as EbXaccount from '../lib/eb-xaccount-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new EbXaccount.EbXaccountStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
