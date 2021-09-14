import { Handler, Context } from 'aws-lambda';
import { SFNClient, StartExecutionCommand, StartExecutionCommandInput } from "@aws-sdk/client-sfn";

const client = new SFNClient({ region: process.env.AWS_REGION });

export const handler: Handler = async (event: any, context: Context) => {
    console.log(JSON.stringify(event));
    
      const params: StartExecutionCommandInput = {
        stateMachineArn: process.env.AWS_SFN_ARN,
        name: event.Records[0].eventID,
        input: event.Records[0].eventID,
      };
      const command = new StartExecutionCommand(params);
    
      try {
        const data = await client.send(command);
        console.log(JSON.stringify(data));
        return 'OK';
      } catch (error) {
        console.error(JSON.stringify(error));
        throw new Error(error);
      }
}