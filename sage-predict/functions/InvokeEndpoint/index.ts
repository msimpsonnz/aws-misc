import { SQSRecord } from 'aws-lambda';
import { SageMakerRuntime } from "aws-sdk";
var sageMakerRuntime = new SageMakerRuntime({ region: process.env.AWS_REGION });

export const InvokeEndpoint = async function (record: SQSRecord) {
    
    //const msg = JSON.parse(record.body);
    //console.log(JSON.stringify(msg));

    var params = {
        Body: record.body,
        EndpointName: process.env.AWS_SAGEMAKER_ENDPOINT || "ERROR GETTING ENV",
        ContentType: 'text/csv'
    };


    const response = await sageMakerRuntime.invokeEndpoint(params).promise()
    console.log(JSON.stringify(response))
    return response

}