const iot = require('../index');
const { Table, Entity } = require('dynamodb-toolbox');
import DynamoDB from 'aws-sdk/clients/dynamodb';
const DocumentClient = new DynamoDB.DocumentClient();

const AWS_DYNAMODB_TABLE = process.env.AWS_DYNAMODB_TABLE || '';

const evtConnect = {
  "clientId": "mjs_demo_iot_group_Core",
  "timestamp": 1597997722480,
  "eventType": "connected",
  "sessionIdentifier": "c2f37c16-80d9-4721-baa4-5e8227c6d4d3",
  "principalIdentifier": "0ae7aae0371413f86614d3dbec32d2d7601a70ed28a22a0a70e8f671d57b69f3",
  "ipAddress": "2407:7000:8862:3400:22b0:1ff:0:4bc",
  "versionNumber": 12
}

const evt = {
    "eventType": "JOB",
    "eventId": "7364ffd1-8b65-4824-85d5-6c14686c97c6",
    "timestamp": 1234567890,
    "operation": "completed",
    "jobId": "01EGFX728RCY6RS28527DD5N0M",
    "status": "COMPLETED",
    "targetSelection": "SNAPSHOT|CONTINUOUS",
    "targets": [
      "arn:aws:iot:ap-southeast-2:383358879677:thing/mjs_demo_iot_group_Core",
    ],
    "description": "My Job Description",
    "completedAt": 1234567890123,
    "createdAt": 1234567890123,
    "lastUpdatedAt": 1234567890123,
    "jobProcessDetails": {
      "numberOfCanceledThings": 0,
      "numberOfRejectedThings": 0,
      "numberOfFailedThings": 0,
      "numberOfRemovedThings": 0,
      "numberOfSucceededThings": 3
    }
  }

test('Test runner', async () => {
  //expect.assertions(1);
  //let result1 = await Job.put(item)
  const result: any = await iot.handler(evt)
  console.log(JSON.stringify(result));
  expect(result[0].imageUrl).toContain("https://d32rdprv3mabi2.cloudfront.net/images/1111/");
});


