const AWS = require('aws-sdk');
const AWSXRay = require('aws-xray-sdk-core');
const logger = require('pino')({level: process.env.LOG_LEVEL || 'info'}, process.stderr);

const ddb = AWSXRay.captureAWSClient(new AWS.DynamoDB());
const AWS_DYNAMODB_TABLE = process.env.AWS_DYNAMODB_TABLE;


// Handler
exports.handler = async function (event, context) {
  // Example without structured logs
  console.log(`Without Structured Logging, Env: ${JSON.stringify(process.env)}`);

  // Example using structured logs in JSON format
  console.log(serialize({ LogLevel: 'Information', Context: context }));

  // Example using a logger package
  logger.debug(event);

  try {
    // If enabled call function to see if we are going to fail randomly
    const fail = failure();
    if (fail) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    if (event.httpMethod == 'GET') {
      const params = {
        TableName: AWS_DYNAMODB_TABLE,
      };
      let resp = await ddb.scan(params).promise();
      logger.debug(resp)

      return formatResponse(serialize(resp));

    } else {
      const params = {
        TableName: AWS_DYNAMODB_TABLE,
        Item: {
          pk: { S: event.requestContext.requestId },
          sk: { S: event.requestContext.requestTime },
        },
      };

      const segment = AWSXRay.getSegment(); //returns the facade segment
      const subsegment = segment.addNewSubsegment('Downstream call to service: x');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      subsegment.close();

      let resp = await ddb.putItem(params).promise();
      return formatResponse(serialize(resp));
    }
  } catch (error) {
    return formatError(error);
  }
};

var formatResponse = function (body) {
  var response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    isBase64Encoded: false,
    body: body,
  };
  return response;
};

var formatError = function (error) {
  var response = {
    statusCode: error.statusCode,
    headers: {
      'Content-Type': 'text/plain',
      'x-amzn-ErrorType': error.code,
    },
    isBase64Encoded: false,
    body: error.code + ': ' + error.message,
  };
  return response;
};

const serialize = function (object) {
  return JSON.stringify(object, null, 2);
};

function failure(range = 24, mod = 4, limit = 3) {
  if (process.env.FAIL === true.toString()) {
    return true
  } if (process.env.FAIL === false.toString()) {
    return false
  } else {
    const r = Math.floor(Math.random() * Math.floor(range))
    const m = r % mod
    const res = (m >= limit)
    console.log(JSON.stringify(`r: ${r}, m: ${m}, res: ${res}`))
    return res
  }
}
