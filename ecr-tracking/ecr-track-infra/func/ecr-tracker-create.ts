import { DynamoDB } from 'aws-sdk'

const dynamoDb = new DynamoDB.DocumentClient()

export async function handler(event: any) {
    console.log(JSON.stringify(event));
    const repositoryName = event.detail.responseElements.image.repositoryName;
    const registryId = event.detail.responseElements.image.registryId;
    const imageDigest = event.detail.responseElements.image.imageId.imageDigest;
    const imageTag = event.detail.responseElements.image.imageId.imageTag;
    const params = {
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
          pk: `container#${registryId}#${repositoryName}`,
          sk: imageTag,
          imageDigest: imageDigest,
          imageTag: imageTag,
          createdDate: event.eventTime,
          event: event,
        }
      }

      try {
          let response = await dynamoDb.put(params).promise();
          console.log(response);
      } catch (error) {
          console.log(error)
      }

    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
            input: event
        })
    }
}