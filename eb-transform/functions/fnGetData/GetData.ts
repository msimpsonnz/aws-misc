import { Database } from './database';
import { Connection } from 'typeorm';
import { Events } from './Events';
import { EventBridge } from 'aws-sdk';
import { url } from 'inspector';

const eventbridge = new EventBridge();

export const GetRecords = async (id: string) => {
  const database = new Database();

  let dbConn: Connection = await database.getConnection();

  const records = await dbConn.getRepository(Events).find();

  if (records.length == 0) {
    for (let index = 0; index < 10; index++) {
    const eventData: Events = {
        project_name: 'demo-project',
        version: Math.floor(Math.random() * Math.floor(10)).toString(),
        deployment_time: new Date().toISOString(),
        deployment_user: `deployment_user_${index}`,
        url: 'url',
        merge_hash: 'merge_hash'
      }
    
      const events = await dbConn.getRepository(Events).save(eventData);
    }
  }

  const batches = await batchEvents(records);

  for await (let batch of batches) {
    let entries: any[] = [];
    batch.forEach((item: any) => {
      const entry = {
        DetailType: process.env.AWS_EVENTBUS_SOURCE,
        Detail: JSON.stringify(item) || 'undefined: event.body',
        EventBusName:
          process.env.AWS_EVENTBUS_NAME || 'undefinded: AWS_EVENTBRIDGE_BUS',
        Resources: [id],
        Source: process.env.AWS_EVENTBUS_SOURCE,
      };
      entries.push(entry);
    });

    var params = {
      Entries: entries,
    };
    const req = await eventbridge.putEvents(params).promise();
    console.log(JSON.stringify(req));
  }
};

export async function batchEvents(
  batchEvents: any[],
  batchSize: number = 10,
  debug: boolean = false
) {
  return await chunks(batchEvents, batchSize, debug);
}

async function chunks(array: any, size: Number, debug: boolean) {
  var results = [];
  while (array.length) {
    results.push(array.splice(0, size));
  }
  if (debug) {
    console.log(JSON.stringify(results));
  }
  return results;
}
