process.env.AWS_REGION = "ap-southeast-2";
process.env.AWS_S3_BUCKET_NAME = "mjs-public-syd-dev";


module.exports = {
    "roots": [
      "<rootDir>/test"
    ],
    testMatch: [ '**/*.test.ts'],
    "transform": {
      "^.+\\.tsx?$": "ts-jest"
    },
  }
