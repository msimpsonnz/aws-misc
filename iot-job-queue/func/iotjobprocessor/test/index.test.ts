const iot = require('../index');
const { Table, Entity } = require('dynamodb-toolbox');
import DynamoDB from 'aws-sdk/clients/dynamodb';
const DocumentClient = new DynamoDB.DocumentClient();

const AWS_DYNAMODB_TABLE = process.env.AWS_DYNAMODB_TABLE || '';
const MyTable = new Table({
    name: AWS_DYNAMODB_TABLE,
    partitionKey: 'pk',
    sortKey: 'sk',
    DocumentClient,
  });

const Job = new Entity({
    name: 'Job',
    attributes: {
      id: { partitionKey: true }, // flag as partitionKey
      sk: { hidden: true, sortKey: true }, // flag as sortKey and mark hidden
      jobDescription: { type: 'string' },
      jobDetail: { type: 'string' },
      jobStatus: ['sk',0],
      jobId: ['sk',1],
    },
    table: MyTable,
});
let item = {
    id: 123,
    jobDescription: 'jobDescription',
    jobDetail: 'jobDetail',
    jobStatus: 'active',
    jobId: 'someGUID1',
  }
  
  // Use the 'put' method of Customer
  //Job.put(item)


const GetJobForDevice = async (clientId: string) => {
    
    let result = await MyTable.query(
        clientId, // partition key
        {
          beginsWith: 'active#'
        }
    );
    console.log(JSON.stringify(result))
    return result;
}



const evt = {
  "clientId": "mjs_demo_iot_group_Core",
  "timestamp": 1597997722480,
  "eventType": "connected",
  "sessionIdentifier": "c2f37c16-80d9-4721-baa4-5e8227c6d4d3",
  "principalIdentifier": "0ae7aae0371413f86614d3dbec32d2d7601a70ed28a22a0a70e8f671d57b69f3",
  "ipAddress": "2407:7000:8862:3400:22b0:1ff:0:4bc",
  "versionNumber": 12
}

test('Test runner', async () => {
  //expect.assertions(1);
  let result1 = await Job.put(item)
  const result: any = await iot.handler(evt)
  console.log(JSON.stringify(result));
  expect(result[0].imageUrl).toContain("https://d32rdprv3mabi2.cloudfront.net/images/1111/");
});


