import { Handler, Context, DynamoDBStreamEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const client = new DynamoDB.DocumentClient();
const tableName =
  process.env.AWS_DYNAMODB_TABLE_NAME || 'failed to get table name';

  function isEmpty(obj: any) { return Object.keys(obj).length === 0 }

export const handler: Handler = async (event: any, context: Context) => {
  console.log(JSON.stringify(event));
  if (event.isFinalInvokeForWindow) {
    console.log('Final: ', event);

    const params = {
      TableName: tableName,
      Item: {
        pk: event.window.end,
        sk: `${event.state.type}#${event.shardId}`,
        windowEnd: event.window.end,
        windowStart: event.window.start,
        shardId: event.shardId,
        events: event.state.events,
        type: event.state.type,
        data: {
            statusCode: event.state.data.statusCode
        }
      },
    };
    return await client.put(params).promise();
  }
  console.log(event);

  // Create the state object on first invocation or use state passed in
  let state = event.state;

  if (isEmpty(state)) {
    state = {
      events: 0,
    };
  }
  console.log('Existing: ', state);

  // Process records with custom aggregation logic

  event.Records.map((item: any) => {
    // Only processing INSERTs
    if (item.eventName != 'INSERT' && item.dynamodb.NewImage.type.S != undefined) return;

    if (state.events == 0) {
        state.events++;
        state.type = item.dynamodb.NewImage.type.S;
        state.data = {
            statusCode: parseFloat(item.dynamodb.NewImage.data.M.statusCode.N)
        }
    } else {
        let value = parseFloat(item.dynamodb.NewImage.events.N);
        console.log('Adding: ', value);
        state.events += value;
    }
    console.log(JSON.stringify(state));
  });

  // Return the state for the next invocation
  console.log('Returning state: ', state);
  return { state: state };
};
