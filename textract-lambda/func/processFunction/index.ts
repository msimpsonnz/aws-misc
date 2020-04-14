import { Handler, Context } from "aws-lambda";
import { SQS, Textract } from "aws-sdk";

const sqs = new SQS();
const textract = new Textract();

export const handler: Handler = async (event: any, context: Context) => {
  console.log(JSON.stringify(event));

  for (var i = 0; i < event.Records.length; i++) {
    await processRequest(event.Records[i]);
  }
};

const processRequest = async function (record: any) {
  try {
    let msg = JSON.parse(record.body);
    console.log(JSON.stringify(msg));
    await startDocumentTextDetection(msg);
    
  } catch (err) {
    console.warn(err);
    if (record.receiptHandle) {
      await resetSQS(record);
  }
    throw err;
  }
};

const startDocumentTextDetection = async function (msg: any) {
  console.log("Sending request to Textract");

  const startDocumentTextDetectionRequestParams = {
    DocumentLocation: {
      S3Object: {
        Bucket: msg.payload.bucket,
        Name: msg.payload.key,
      },
    },
    NotificationChannel: {
      RoleArn:
        process.env.AWS_TEXTRACT_PUBLISH_TO_SNS_IAM_ROLE_ARN ||
        "AWS_TEXTRACT_PUBLISH_TO_SNS_IAM_ROLE_ARN",
      SNSTopicArn:
        process.env.AWS_TEXTRACT_PUBLISH_SNS_TOPIC_ARN ||
        "AWS_TEXTRACT_PUBLISH_SNS_TOPIC_ARN",
    },
  };

  const startDocumentTextDetectionResponse = await textract
    .startDocumentTextDetection(startDocumentTextDetectionRequestParams)
    .promise();

  if (
    startDocumentTextDetectionResponse &&
    startDocumentTextDetectionResponse.JobId
  ) {
    return startDocumentTextDetectionResponse.JobId;
  } else {
    throw new Error(JSON.stringify(startDocumentTextDetectionResponse));
  }
};

const resetSQS = async function (record: any) {

let sqsRetryParam: SQS.ChangeMessageVisibilityRequest = {
  QueueUrl: process.env.AWS_REQUEST_SQS_QUEUE_URL || "AWS_REQUEST_SQS_QUEUE_URL",
  ReceiptHandle: record.receiptHandle,
  VisibilityTimeout: 0
}

sqsRetryParam.VisibilityTimeout = requestWithRetry(5,
    record.attributes.ApproximateReceiveCount
  );

  try {
    await sqs.changeMessageVisibility(sqsRetryParam).promise();
  } catch (err) {
    console.error(err);
  }
};

function requestWithRetry(retryCount: Number, currentTries = 1): number {
  if (currentTries <= retryCount) {
    const timeout = (Math.pow(2, currentTries) - 1) * 100;
    console.log(timeout);
    return timeout;
  } else {
    return 0;
  }
}
