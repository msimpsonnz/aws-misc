import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as GlueTransform from '../lib/glue-transform-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new GlueTransform.GlueTransformStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
