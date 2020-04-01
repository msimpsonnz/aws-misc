import { Handler, APIGatewayEvent, Context } from "aws-lambda";
import { S3 } from "aws-sdk";

const s3 = new S3({
  signatureVersion: 'v4'
});

export const handler: Handler = async (
  event: APIGatewayEvent,
  context: Context
) => {
  console.log(JSON.stringify(event));
  let key = null;

  if (event.queryStringParameters && event.queryStringParameters.key) {
    console.log("Received key: " + event.queryStringParameters.key);
    key = event.queryStringParameters.key;
  }
  else if (key == null) {
      throw new Error("Did not receive an S3 key");
  }


  const signedUrl = s3.getSignedUrl("getObject", {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Expires: 60 * 5
  });
  const data = {
    url: signedUrl
  };
  console.log(data.url);
  return {
    statusCode: 200,
    body: JSON.stringify(data),
    isBase64Encoded: false,
    headers: {
      "content-type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  };
};
