import { DynamoDB } from 'aws-sdk'

const dynamoDb = new DynamoDB.DocumentClient()

export async function handler(event: any) {
    console.log(event);
    const registryId = event.detail.requestParameters.registryId;
    const repositoryName = event.detail.requestParameters.repositoryName;
    const imageTag = event.detail.requestParameters.imageIds[0].imageTag;
    
    const params = {
        TableName: process.env.DYNAMODB_TABLE,
        Key: {
            pk: `container#${registryId}#${repositoryName}`,
            sk: imageTag
          },
          UpdateExpression: "set lastAccessedDate = :val1",
          ExpressionAttributeValues: {
              ":val1": event.detail.eventTime,
        }
    }
    console.log(`Query: ${JSON.stringify(params)}`);

      try {
          let response = await dynamoDb.update(params).promise();
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