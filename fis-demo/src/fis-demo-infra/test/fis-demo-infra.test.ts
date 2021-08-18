import * as cdk from 'aws-cdk-lib';
import * as FisDemoInfra from '../lib/fis-demo-infra-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new FisDemoInfra.FisDemoInfraStack(app, 'MyTestStack');
    // THEN
    const actual = app.synth().getStackArtifact(stack.artifactId).template;
    expect(actual.Resources ?? {}).toEqual({});
});
