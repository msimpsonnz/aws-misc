import { expect as expectCDK, matchTemplate, MatchStyle, SynthUtils, haveResourceLike } from '@aws-cdk/assert';
import * as assert from '@aws-cdk/assert';
import * as nassert from 'assert';
import * as cdk from '@aws-cdk/core';
import * as PipelineStack from '../lib/pipeline-stack-stack';

test('Admin Access', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new PipelineStack.PipelineStackStack(app, 'MyTestStack');
  // THEN
  expectCDK(stack).notTo(assert.haveResourceLike('AWS::IAM::Policy', {
    PolicyDocument: {
      Statement: [
        {
          Action: '*',
          Effect: 'Allow',
          Resource: '*',
        },
      ]
    }
  }))
});
