const func = require('../index');
//const events = require('./sampleEvent');
import { SQSRecord } from 'aws-lambda';

const data = "0.09178,0.0,4.05,0.0,0.51,6.416,84.1,2.6463,5.0,296.0,16.6,395.5,9.04"
// 0.05644,40.0,6.41,1.0,0.447,6.758,32.9,4.0776,4.0,254.0,17.6,396.9,3.53
// 0.10574,0.0,27.74,0.0,0.609,5.983,98.8,1.8681,4.0,711.0,20.1,390.11,18.07
// 0.09164,0.0,10.81,0.0,0.413,6.065,7.8,5.2873,4.0,305.0,19.2,390.91,5.52"
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