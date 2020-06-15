import { SQSEvent } from 'aws-lambda';
import { S3 } from 'aws-sdk';

const s3 = new S3({
  signatureVersion: 'v4',
});

export const PutRecords = async (event: SQSEvent) => {
  try {
    console.log(JSON.stringify(event));

    for await (let records of event.Records) {
      const putObjectReq: S3.PutObjectRequest = {
        Bucket: process.env.AWS_S3_BUCKET || 'failed to get bucket id',
        Key: `events/${records.messageId}.json`,
        Body: records.body,
        ContentType: 'application/json',
      };

      const putObject = await s3.putObject(putObjectReq).promise();
      console.log(putObject);
    }
    return {
      statusCode: 200,
    };
  } catch (error) {
    throw new Error(error);
  }
};
