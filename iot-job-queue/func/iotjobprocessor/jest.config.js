process.env.AWS_REGION = "ap-southeast-2";
process.env.AWS_DYNAMODB_TABLE = "IotJobQueueStack-table8235A42E-1K724BK4K1BVV";
process.env.AWS_IOT_ENDPOINT = "iot.ap-southeast-2.amazonaws.com";




module.exports = {
    "roots": [
      "<rootDir>"
    ],
    testMatch: [ '**/*.test.ts'],
    "transform": {
      "^.+\\.tsx?$": "ts-jest"
    },
  }
