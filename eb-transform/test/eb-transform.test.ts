import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as EbTransform from '../lib/eb-transform-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new EbTransform.EbTransformStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
