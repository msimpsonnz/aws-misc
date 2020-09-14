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

interface user {
    gender: string,
    first: string,
    last: string,
    age: number,
    latitude: string,
    longitude: string
}

const GetData = async () => {
    const response = await fetch('https://randomuser.me/api/?format=json&results=5&inc=gender,name,location,dob&noinfo')
    const body = await response.json();
    console.log(`{ Users: ${JSON.stringify(body)}}`);
    let results: user[] = [];
    body.results.forEach((user: any) => {
        const newUser: user = {
            gender: user.gender,
            first: user.name.first,
            last: user.name.last,
            age: user.dob.age,
            latitude: user.location.coordinates.latitude,
            longitude: user.location.coordinates.longitude
        }
        results.push(newUser);
    });
    return results;
}

const PutData = async (users: user[]) => {
    //const users = JSON.parse(data);
    //console.log(`{ Users: ${JSON.stringify(users)}}`);

    let records: { Data: any; PartitionKey: string; }[] = [];
    users.forEach((user: user) => {
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