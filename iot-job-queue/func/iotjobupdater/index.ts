import { Handler, Context } from 'aws-lambda';
const { Table, Entity } = require('dynamodb-toolbox');
import DynamoDB from 'aws-sdk/clients/dynamodb';
const DocumentClient = new DynamoDB.DocumentClient();

export const handler: Handler = async (event: any, context: Context) => {
  console.log(`Event: ${JSON.stringify(event)}`);
  await FunctionRunner(event);
};

const FunctionRunner = async (event: any) => {
  if (event.eventType === 'JOB' && event.status === 'COMPLETED') {
    for await (const target of event.targets) {
      const update = await GetJobForDevice(target, event.jobId);
      console.log(`Job Status: ${JSON.stringify(update)}`);
    }
  } else {
    return new Error('Failed to determine event type');
  }
  return
};

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
    jobStatus: ['sk', 0],
    jobId: ['sk', 1],
  },
  table: MyTable,
});

const GetJobForDevice = async (clientId: string, jobId: string) => {
  const thingId = clientId.split('/')[1];
  const key = {
    id: thingId,
    jobStatus: 'active',
    jobId: jobId,
  };
  console.log(`Request: ${JSON.stringify(key)}`);
  let result = await Job.get(key);
  console.log(`Get Result: ${JSON.stringify(result)}`);
  result.Item.jobStatus = 'completed';
  const upsert = await Job.update(result.Item);
  console.log(`Upsert Result: ${JSON.stringify(upsert)}`);
  const remove = await Job.delete(key);
};
