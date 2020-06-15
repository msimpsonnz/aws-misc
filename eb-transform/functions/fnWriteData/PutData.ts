import { S3 } from 'aws-sdk';

const s3 = new S3({
  signatureVersion: 'v4',
});

export const PutRecords = async (event: any) => {
  try {
    console.log(JSON.stringify(event));

    const putObjectReq: S3.PutObjectRequest = {
      Bucket: process.env.AWS_S3_BUCKET || 'failed to get bucket id',
      Key: `events/${event.id}`,
      Body: JSON.stringify(event.body),
      ContentType: 'application/json',
    };

    const putObject = await s3.putObject(putObjectReq).promise();
    console.log(putObject);

    return {
      statusCode: 200,
    };
  } catch (error) {
    throw new Error(error);
  }
};
