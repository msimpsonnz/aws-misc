import cdk = require('@aws-cdk/cdk');
import sqs = require('@aws-cdk/aws-sqs');

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new sqs.Queue(this, 'batchQueue')
  }
}
