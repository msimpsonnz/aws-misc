import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as DdbStreamAgg from '../lib/ddb-stream-agg-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new DdbStreamAgg.DdbStreamAggStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
