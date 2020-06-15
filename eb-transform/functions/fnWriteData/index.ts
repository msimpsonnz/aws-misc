import { Handler, Context, SQSEvent } from 'aws-lambda';
import { PutRecords } from './PutData'

export const handler: Handler = async (event: SQSEvent, context: Context) => {
  try {
      await PutRecords(event)
    return {
      statusCode: 200,
    };
  } catch (error) {
    throw new Error(error);
  }
};
