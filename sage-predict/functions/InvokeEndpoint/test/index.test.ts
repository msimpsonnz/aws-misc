const func = require('../index');
//const events = require('./sampleEvent');
import { SQSRecord } from 'aws-lambda';

const data = "25,1,999,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,1,0"
// 1,28,3,999,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,1,0
// 1,38,1,999,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,0,1,0,0,1,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0

const record: SQSRecord = {
    messageId: "messageId",
    receiptHandle: 'receiptHandle',
    body: data,
    attributes: {
        ApproximateReceiveCount: "ApproximateReceiveCount",
        SentTimestamp: 'SentTimestamp',
        SenderId: 'SenderId',
        ApproximateFirstReceiveTimestamp: 'ApproximateFirstReceiveTimestamp'
    },
    messageAttributes: {
    },
    md5OfBody: 'md5OfBody',
    eventSource: 'eventSource',
    eventSourceARN: 'eventSourceARN',
    awsRegion: 'awsRegion'
}


test('Test Runner', async () => {
  expect.assertions(1);
  return func.InvokeEndpoint(record).then((res: { ContentType: any; }) => expect(res.ContentType).toEqual('text/csv; charset=utf-8'));
});