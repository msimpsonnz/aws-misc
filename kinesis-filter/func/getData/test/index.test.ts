const lambda = require('../index');

const data = {
    "Records": [
        {
            "eventVersion": "2.1",
            "eventSource": "aws:s3",
            "awsRegion": "ap-southeast-2",
            "eventTime": "2020-08-14T12:17:27.492Z",
            "eventName": "ObjectCreated:Put",
            "userIdentity": {
                "principalId": "AWS:AROAVSQPYI663Y66OWLPX:CfApiStack-fnImageService01E11265-1M8TSK5XDZ4JU"
            },
            "requestParameters": {
                "sourceIPAddress": "54.240.193.129"
            },
            "responseElements": {
                "x-amz-request-id": "0D86E75229DC1D7C",
                "x-amz-id-2": "KTcBX/axWwSs+VWegq4wFNCTDYqajd9ioy7NZzpO6SEv1TlE/wax8snfDkOBLXzQvP1nPsy3ziZxIgTEzkFUpG9ekJh9f1xn"
            },
            "s3": {
                "s3SchemaVersion": "1.0",
                "configurationId": "ZGM1M2FkODctY2IwYS00ODBmLThkMzgtYWI5MzI5NGZkY2Q0",
                "bucket": {
                    "name": "mjs-demo-cf-upload",
                    "ownerIdentity": {
                        "principalId": "A9EI5D285UCCW"
                    },
                    "arn": "arn:aws:s3:::mjs-demo-cf-upload"
                },
                "object": {
                    "key": "upload/1111/01EFPEBNNC3Q25J5KWRSSDBJS7.jpg",
                    "size": 117844,
                    "eTag": "569dd1952336d8400929e2bcc449f2f1",
                    "sequencer": "005F3680D7CBB12D58"
                }
            }
        }
    ]
}
test('Runner', async () => {
  expect.assertions(1);
  return lambda.handler(data).then((res: { statusCode: any; }) => expect(res.statusCode).toEqual(200));
});