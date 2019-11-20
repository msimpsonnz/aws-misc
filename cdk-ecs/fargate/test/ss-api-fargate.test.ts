import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import SsApiFargate = require('../lib/ss-api-fargate-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new SsApiFargate.SsApiFargateStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});