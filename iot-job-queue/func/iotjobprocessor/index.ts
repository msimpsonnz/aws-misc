import { Handler, Context } from 'aws-lambda';
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
    console.log(`Event: ${JSON.stringify(event)}`);
    await FunctionRunner(event)
}

const FunctionRunner = async (event: any) => {
    if (event.eventType === 'connected') {
        const jobs = await GetActiveJobsForDevice(event.clientId)
        for await (const job of jobs.Items) {
            console.log(`Job: ${JSON.stringify(job)}`);
            const thingArn = await GetThingArn(job.id);
            await CreateJobForDevice(job.jobId, thingArn);
        }
    }
    else if (event.eventType === 'JOB' && event.status === 'COMPLETED') {
        for await (const target of event.targets) {
            const update = await GetJobForDevice(target, event.jobId)
            console.log(`Job Status: ${JSON.stringify(update)}`);
        }
    } 
    else{
        return new Error('Failed to determine event type')
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

const GetActiveJobsForDevice = async (clientId: string) => {
    
    let result = await MyTable.query(
        clientId, // partition key
        {
          beginsWith: 'active#'
        }
    );
    console.log(JSON.stringify(result))
    return result;
}

const GetJobForDevice = async (clientId: string, jobId: string) => {
    const thingId = clientId.split('/')[1];
    const key = {
        id: thingId,
        jobStatus: 'active',
        jobId: jobId
    }
    console.log(`Request: ${JSON.stringify(key)}`)
    let result = await Job.get(
        key
    );
    console.log(`Get Result: ${JSON.stringify(result)}`)
    result.Item.jobStatus = 'completed'
    const upsert = await Job.update(result.Item);
    console.log(`Upsert Result: ${JSON.stringify(upsert)}`);
    const remove = await Job.delete(
        key
    );
}

const GetThingArn = async (id: string) => {
    const params = {
        thingName: id,
    }
    const thing = await IotClient.describeThing(params).promise()
    console.log(thing.thingArn)
    return thing.thingArn || 'ERROR: Failed to get thingARN'
}

const CreateJobForDevice = async (jobId: string, thingArn: string) => {
    const doc = {
        "operation":"customJob",
        "otherInfo":"someValue"
    };
    const params = {
        jobId: jobId,
        targets: [
            thingArn
        ],
        document: JSON.stringify(doc)
    }
    const jobResult = await IotClient.createJob(params).promise()
    console.log(jobResult)
}



