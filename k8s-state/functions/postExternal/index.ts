import { Handler, Context } from 'aws-lambda';

//client
export const handler: Handler = async (event: any, context: Context) => {
    console.log(JSON.stringify(event));
    //sqs logic here
    //2
    //3
    //4
    //5
    return(event);
}