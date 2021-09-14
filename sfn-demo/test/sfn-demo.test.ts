import * as cdk from 'aws-cdk-lib';
import * as SfnDemo from '../lib/sfn-demo-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new SfnDemo.SfnDemoStack(app, 'MyTestStack');
    // THEN
    const actual = app.synth().getStackArtifact(stack.artifactId).template;
    expect(actual.Resources ?? {}).toEqual({});
});
