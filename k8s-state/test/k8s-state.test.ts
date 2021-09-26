import * as cdk from 'aws-cdk-lib';
import * as K8SState from '../lib/k8s-state-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new K8SState.K8SStateStack(app, 'MyTestStack');
    // THEN
    const actual = app.synth().getStackArtifact(stack.artifactId).template;
    expect(actual.Resources ?? {}).toEqual({});
});
