process.env.AWS_ACCOUNT_ID = '383358879677';
process.env.AWS_REGION = 'ap-southeast-2';
process.env.AWS_BATCH_FN_ARN = 'arn:aws:lambda:ap-southeast-2:383358879677:function:S3BatchStack-fnbatchCopy2BF74A30-I4VXXTQDTRR2';
process.env.AWS_BATCH_ROLE_ARN = 'arn:aws:iam::383358879677:role/S3BatchStack-roleBatchBC77B89E-OVZCZ72KO36D';
process.env.AWS_S3_BUCKET_NAME = 's3batchstack-s3extractbucketad315b35-168f27ra2a3k6';

module.exports = {
    "roots": [
      "<rootDir>/test"
    ],
    testMatch: [ '**/*.test.ts'],
    "transform": {
      "^.+\\.tsx?$": "ts-jest"
    },
  }