import { SQSHandler, Context, SQSEvent, SQSRecord } from 'aws-lambda';
import { InvokeEndpoint } from '../InvokeEndpoint';

export const handler: SQSHandler = async (event: SQSEvent, context: Context) => {
    console.log(JSON.stringify(event));

    const promises = event.Records.map((record: SQSRecord) => InvokeEndpoint(record));
    await Promise.all(promises)
}