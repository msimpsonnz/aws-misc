import { Handler, Context } from 'aws-lambda';
import { ulid } from 'ulid';
const { Table, Entity } = require('dynamodb-toolbox');
import DynamoDB from 'aws-sdk/clients/dynamodb';
const DocumentClient = new DynamoDB.DocumentClient();
import Iot from 'aws-sdk/clients/iot';
const AWS_IOT_ENDPOINT = process.env.AWS_IOT_ENDPOINT || '';
const IotClient = new Iot({
    endpoint: AWS_IOT_ENDPOINT
});

export const handler: Handler = async (
  event: any,
  context: Context
) => {
    console.log(JSON.stringify(event));
    await FunctionRunner(event)
}

const FunctionRunner = async (event: any) => {
    if (event.clientId) {
        const jobs = await GetJobForDevice(event.clientId)
        for await (const job of jobs.Items) {
            console.log(`Job: ${JSON.stringify(job)}`)
            await CreateJobForDevice(job)
        }
    }
    else {
        return new Error('Failed to get event body')
    } 
}

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

const CreateJobForDevice = async (job: any) => {
    const params = {
        jobId: job.jobId,
        targets: [
            job.id
        ],
    }
    const jobResult = await IotClient.createJob(params).promise()
    console.log(jobResult)
}



