process.env.AWS_SAGEMAKER_ENDPOINT = "xgboost-2020-07-07-07-32-11-117"
process.env.AWS_REGION= "ap-southeast-2"

module.exports = {
    "roots": [
      "<rootDir>/test"
    ],
    testMatch: [ '**/*.test.ts'],
    "transform": {
      "^.+\\.tsx?$": "ts-jest"
    },
  }
