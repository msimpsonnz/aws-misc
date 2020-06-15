import { Handler, Context } from 'aws-lambda';
import { GetRecords } from './GetData'

export const handler: Handler = async (event: any, context: Context) => {
  try {
      await GetRecords(event.id)
    return {
      statusCode: 200,
    };
  } catch (error) {
    throw new Error(error);
  }
};
