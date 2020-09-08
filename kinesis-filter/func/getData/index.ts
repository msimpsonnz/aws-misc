import { Handler, CloudWatchLogsEvent, Context } from 'aws-lambda';
import fetch from 'node-fetch';
import Kinesis from 'aws-sdk/clients/kinesis';
const kinesis = new Kinesis();
const AWS_KINSESIS_STREAM = process.env.AWS_KINSESIS_STREAM || '';

export const handler: Handler = async (
    event: CloudWatchLogsEvent,
    context: Context
  ) => {
    console.log(`{ Event: ${JSON.stringify(event)}}`);
    await FunctionRunner(event)
  }

const FunctionRunner = async (event: any) => {
    const data = await GetData();
    await PutData(data);

}

const GetData = async () => {
    const response = await fetch('https://randomuser.me/api/?format=json&results=5')
    const body = await response.text();
    console.log(`{ Users: ${JSON.stringify(body)}}`);
    return body;
}

const PutData = async (data: string) => {
    const users = JSON.parse(data);
    console.log(`{ Users: ${JSON.stringify(users)}}`);

    let records: { Data: any; PartitionKey: string; }[] = [];
    users.results.forEach((user: any) => {
        const addUser = {
            Data: JSON.stringify(user),
            PartitionKey: 'users'
        }
        records.push(addUser)
    });
    console.log(`{ Records: ${JSON.stringify(records)}}`);


    var params = {
        Records: records,
        StreamName: AWS_KINSESIS_STREAM
    };
    await kinesis.putRecords(params).promise();

}