import { Handler, Context } from 'aws-lambda';
import { S3 } from 'aws-sdk';

const s3 = new S3({
    signatureVersion: 'v4',
  });

export const handler: Handler = async (event: any, context: Context) => {
    console.log(JSON.stringify(event));
    const batches = await batchEvents(event.Records)
    console.log(JSON.stringify(batches))
    let batchId = 1
    let batchList = []

    for await (const batch of batches) {
        console.log(JSON.stringify(batch));
        const executionId = event.id.substring(event.id.lastIndexOf(":") + 1, event.id.length);
        const s3Key = `${executionId}/jobs/${batchId}.json`;
        console.log(JSON.stringify(s3Key));
        const putObjectReq: S3.PutObjectRequest = {
            Bucket: process.env.AWS_S3_BUCKET_NAME || 'failed to get bucket name',
            Key: s3Key,
            Body: JSON.stringify(batch),
            ContentType: 'application/json',
          };
      
          const putObject = await s3.putObject(putObjectReq).promise();
          console.log(putObject);
          const entry = {
              batchFile: s3Key
          }
          batchList.push(entry);
          batchId++;
    }
    return {
        batchList: batchList
    };
}



async function batchEvents(batchEvents: any[], batchSize: number = 2, debug: boolean = false) {
    return await chunks(batchEvents, batchSize, debug)
}

async function chunks(array: any, size: Number, debug: boolean) {
    var results = [];
    while (array.length) {
      results.push(array.splice(0, size));
    }
    if (debug) {
        console.log(JSON.stringify(results))
    }
    return results;
  };