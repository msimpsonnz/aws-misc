import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as FirehoseLoad from '../lib/firehose-load-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new FirehoseLoad.FirehoseLoadStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
