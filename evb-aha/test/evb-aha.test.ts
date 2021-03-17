import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as EvbAha from '../lib/evb-aha-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new EvbAha.EvbAhaStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
