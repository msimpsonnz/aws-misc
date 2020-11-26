const lambda = require('../index');

const data = {
    "manifests": [
        {
            "batchFile": "extract/89a85b4e-b4af-42c4-93ee-f9ce9cfcc51f/task/1.json",
            "manifests": {
                "ExecutedVersion": "$LATEST",
                "Payload": {
                    "ETag": "\"44f66718f5a8006ff8d94004b78c2aa0\"",
                    "ObjectArn": "arn:aws:s3:::s3batchstack-s3extractbucketad315b35-168f27ra2a3k6/extract/89a85b4e-b4af-42c4-93ee-f9ce9cfcc51f/manifest/1.csv"
                },
                "SdkHttpMetadata": {
                    "AllHttpHeaders": {
                        "X-Amz-Executed-Version": [
                            "$LATEST"
                        ],
                        "x-amzn-Remapped-Content-Length": [
                            "0"
                        ],
                        "Connection": [
                            "keep-alive"
                        ],
                        "x-amzn-RequestId": [
                            "cd014bf7-8984-4a69-a1ba-72577ae69a95"
                        ],
                        "Content-Length": [
                            "185"
                        ],
                        "Date": [
                            "Thu, 26 Nov 2020 14:36:22 GMT"
                        ],
                        "X-Amzn-Trace-Id": [
                            "root=1-5fbfbd64-113489c41e2ea63c422497dd;sampled=0"
                        ],
                        "Content-Type": [
                            "application/json"
                        ]
                    },
                    "HttpHeaders": {
                        "Connection": "keep-alive",
                        "Content-Length": "185",
                        "Content-Type": "application/json",
                        "Date": "Thu, 26 Nov 2020 14:36:22 GMT",
                        "X-Amz-Executed-Version": "$LATEST",
                        "x-amzn-Remapped-Content-Length": "0",
                        "x-amzn-RequestId": "cd014bf7-8984-4a69-a1ba-72577ae69a95",
                        "X-Amzn-Trace-Id": "root=1-5fbfbd64-113489c41e2ea63c422497dd;sampled=0"
                    },
                    "HttpStatusCode": 200
                },
                "SdkResponseMetadata": {
                    "RequestId": "cd014bf7-8984-4a69-a1ba-72577ae69a95"
                },
                "StatusCode": 200
            }
        },
        {
            "batchFile": "extract/89a85b4e-b4af-42c4-93ee-f9ce9cfcc51f/task/2.json",
            "manifests": {
                "ExecutedVersion": "$LATEST",
                "Payload": {
                    "ETag": "\"7e1a8793f66989b30584e3e8f197dfaa\"",
                    "ObjectArn": "arn:aws:s3:::s3batchstack-s3extractbucketad315b35-168f27ra2a3k6/extract/89a85b4e-b4af-42c4-93ee-f9ce9cfcc51f/manifest/2.csv"
                },
                "SdkHttpMetadata": {
                    "AllHttpHeaders": {
                        "X-Amz-Executed-Version": [
                            "$LATEST"
                        ],
                        "x-amzn-Remapped-Content-Length": [
                            "0"
                        ],
                        "Connection": [
                            "keep-alive"
                        ],
                        "x-amzn-RequestId": [
                            "73caa147-8414-4da6-b21f-327dc2dc8d1f"
                        ],
                        "Content-Length": [
                            "185"
                        ],
                        "Date": [
                            "Thu, 26 Nov 2020 14:36:22 GMT"
                        ],
                        "X-Amzn-Trace-Id": [
                            "root=1-5fbfbd64-32031f550c3d54ee2742ce22;sampled=0"
                        ],
                        "Content-Type": [
                            "application/json"
                        ]
                    },
                    "HttpHeaders": {
                        "Connection": "keep-alive",
                        "Content-Length": "185",
                        "Content-Type": "application/json",
                        "Date": "Thu, 26 Nov 2020 14:36:22 GMT",
                        "X-Amz-Executed-Version": "$LATEST",
                        "x-amzn-Remapped-Content-Length": "0",
                        "x-amzn-RequestId": "73caa147-8414-4da6-b21f-327dc2dc8d1f",
                        "X-Amzn-Trace-Id": "root=1-5fbfbd64-32031f550c3d54ee2742ce22;sampled=0"
                    },
                    "HttpStatusCode": 200
                },
                "SdkResponseMetadata": {
                    "RequestId": "73caa147-8414-4da6-b21f-327dc2dc8d1f"
                },
                "StatusCode": 200
            }
        },
        {
            "batchFile": "extract/89a85b4e-b4af-42c4-93ee-f9ce9cfcc51f/task/3.json",
            "manifests": {
                "ExecutedVersion": "$LATEST",
                "Payload": {
                    "ETag": "\"1765e7439040aee807416a43d02a8b06\"",
                    "ObjectArn": "arn:aws:s3:::s3batchstack-s3extractbucketad315b35-168f27ra2a3k6/extract/89a85b4e-b4af-42c4-93ee-f9ce9cfcc51f/manifest/3.csv"
                },
                "SdkHttpMetadata": {
                    "AllHttpHeaders": {
                        "X-Amz-Executed-Version": [
                            "$LATEST"
                        ],
                        "x-amzn-Remapped-Content-Length": [
                            "0"
                        ],
                        "Connection": [
                            "keep-alive"
                        ],
                        "x-amzn-RequestId": [
                            "4c772698-0022-4508-a8f0-d8f3f7eb08aa"
                        ],
                        "Content-Length": [
                            "185"
                        ],
                        "Date": [
                            "Thu, 26 Nov 2020 14:36:22 GMT"
                        ],
                        "X-Amzn-Trace-Id": [
                            "root=1-5fbfbd64-1cadd3e64c2148231b9d7c22;sampled=0"
                        ],
                        "Content-Type": [
                            "application/json"
                        ]
                    },
                    "HttpHeaders": {
                        "Connection": "keep-alive",
                        "Content-Length": "185",
                        "Content-Type": "application/json",
                        "Date": "Thu, 26 Nov 2020 14:36:22 GMT",
                        "X-Amz-Executed-Version": "$LATEST",
                        "x-amzn-Remapped-Content-Length": "0",
                        "x-amzn-RequestId": "4c772698-0022-4508-a8f0-d8f3f7eb08aa",
                        "X-Amzn-Trace-Id": "root=1-5fbfbd64-1cadd3e64c2148231b9d7c22;sampled=0"
                    },
                    "HttpStatusCode": 200
                },
                "SdkResponseMetadata": {
                    "RequestId": "4c772698-0022-4508-a8f0-d8f3f7eb08aa"
                },
                "StatusCode": 200
            }
        }
    ],
    "id": "arn:aws:states:ap-southeast-2:383358879677:execution:sfnWorkflowE38B1DCE-o4n9mt6Hxzn7:89a85b4e-b4af-42c4-93ee-f9ce9cfcc51f"
}

test('Runner', async () => {
  expect.assertions(1);
  return lambda
    .handler(data)
    .then((res: { statusCode: any }) => expect(res.statusCode).toEqual(200));
});
