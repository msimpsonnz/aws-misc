import { Handler, Context } from 'aws-lambda';

export const handler: Handler = async (event: any, context: Context) => {
    console.log(JSON.stringify(event));
    return(event);
}