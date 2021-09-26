//import { Handler, Context } from 'aws-lambda';

//client
export const handler: Handler = async (event: any, context: Context) => {
    console.log(JSON.stringify(event));
    //sqs logic here
    //2
    //3
    //4
    //5

    try {
        //read DDB to check for state
        //parse result
        //if logic
        //save record to DDB
        //take 1st action
        //save record to DDB
        //else logic
        //take 2/3 action loop
        //save state DDB
        //sqs handler
    } catch (error) {
        //sqs write
    }

    return(event);
}