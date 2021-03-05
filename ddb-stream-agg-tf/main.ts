import { Construct } from 'constructs';
import { App, TerraformOutput, TerraformStack } from 'cdktf';
import {
  AwsProvider,
  // IamRole,
  // IamPolicy,
  // DataAwsIamPolicyDocument,
  // IamRolePolicyAttachment,
  DynamodbTable,
  //LambdaFunction,
} from './.gen/providers/aws';

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AwsProvider(this, 'aws', {
      region: 'ap-southeast-2',
    });

    const table = new DynamodbTable(this, 'table', {
      name: 'ddb-stream-agg',
      attribute: [
        {
          name: 'pk',
          type: 'S',
        },
        {
          name: 'sk',
          type: 'S',
        },
      ],
      hashKey: 'pk',
      rangeKey: 'sk',
      streamEnabled: true,
      streamViewType: 'NEW_IMAGE',
      ttl: [
        {
          enabled: true,
          attributeName: 'ttl'
        }
      ],
      billingMode: 'PAY_PER_REQUEST'
    });

    new TerraformOutput(this, "table_name", {
      value: table.name,
    })

  }
}

const app = new App({ stackTraces: false });
new MyStack(app, 'kda-tf');
app.synth();
