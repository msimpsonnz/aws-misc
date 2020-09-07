import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as KinesisFilter from '../lib/kinesis-filter-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new KinesisFilter.KinesisFilterStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
