process.env.AWS_S3_BUCKET_NAME = 's3batchstack-s3extractbucketad315b35-168f27ra2a3k6'
process.env.AWS_DYNAMODB_TABLE_NAME = 'S3BatchStack-table8235A42E-19OACMY418CJB'
process.env.AWS_REGION = 'ap-southeast-2'
module.exports = {
    "roots": [
      "<rootDir>/test"
    ],
    testMatch: [ '**/*.test.ts'],
    "transform": {
      "^.+\\.tsx?$": "ts-jest"
    },
  }