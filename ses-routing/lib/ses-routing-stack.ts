import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as ses from '@aws-cdk/aws-ses';
import * as actions from '@aws-cdk/aws-ses-actions';

export class SesRoutingStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'Bucket');

    new ses.ReceiptRuleSet(this, 'RuleSet', {
      rules: [
        {
          actions: [
            new actions.S3({
              bucket,
              objectKeyPrefix: 'emails/',
            }),
          ],
        },
      ],
    });
  }
}
