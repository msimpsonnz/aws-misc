import * as cdk from 'aws-cdk-lib';
import * as ApiKey from '../lib/api-key-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new ApiKey.ApiKeyStack(app, 'MyTestStack');
    // THEN
    const actual = app.synth().getStackArtifact(stack.artifactId).template;
    expect(actual.Resources ?? {}).toEqual({});
});
