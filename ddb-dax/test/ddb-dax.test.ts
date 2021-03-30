import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as DdbDax from '../lib/ddb-dax-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new DdbDax.DdbDaxStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
