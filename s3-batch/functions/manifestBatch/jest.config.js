process.env.AWS_S3_BUCKET_NAME = 'mjs-syd'
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