import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as FargateScale from '../lib/fargate-scale-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new FargateScale.FargateScaleStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
