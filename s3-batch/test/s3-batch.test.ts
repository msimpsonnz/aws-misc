import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as S3Batch from '../lib/s3-batch-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new S3Batch.S3BatchStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
