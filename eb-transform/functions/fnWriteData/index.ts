import { Handler, Context } from 'aws-lambda';
import { PutRecords } from './PutData'

export const handler: Handler = async (event: any, context: Context) => {
  try {
      await PutRecords(event.id)
    return {
      statusCode: 200,
    };
  } catch (error) {
    throw new Error(error);
  }
};
