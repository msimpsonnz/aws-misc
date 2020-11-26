import { Handler, Context } from 'aws-lambda';
import { DynamoDB, S3 } from 'aws-sdk';

const s3 = new S3({
  signatureVersion: 'v4',
});
const bucket = process.env.AWS_S3_BUCKET_NAME || 'failed to get bucket name';

const client = new DynamoDB.DocumentClient();
const tableName = process.env.AWS_DYNAMODB_TABLE_NAME || 'failed to get table name';

export const handler: Handler = async (event: any, context: Context) => {
  console.log(JSON.stringify(event));
  const executionId = event.id.substring(event.id.lastIndexOf(":") + 1, event.id.length);
  const s3Key = event.batchFile;
  const getObjectReq: S3.GetObjectRequest = {
    Bucket: bucket,
    Key: s3Key,
  };

  const getObject = await s3.getObject(getObjectReq).promise();
  const objectData = getObject.Body?.toString('utf-8');
  const extractItems = JSON.parse(objectData || '[]');
  console.log(JSON.stringify(extractItems));
  const itemKeys: { pk: { S: any; }; }[] = []
  extractItems.forEach((record: { recordId: any; }) => {
    const key = {
      'pk': record.recordId.toString()
    }
    itemKeys.push(key)
  });

  var params = {
    RequestItems: {
      [tableName]: {
        Keys: itemKeys,
        ProjectionExpression: 'pk, sourceBucket, sourceKey'
      }
    }
  };
  const metaData = await client.batchGet(params).promise()

  interface manifest {
    recordId: string;
    itemDetail: {
      sourceBucket: string;
      params: {
        sourceKey: string;
        extractKey: string;
      }
    }
  }

  let manifest: manifest[] = []
  
  metaData.Responses?.[tableName].forEach(record => {
    const extractKey = extractItems.filter((x: { recordId: any; }) => x.recordId == record.pk)[0].extractKey
    console.log(JSON.stringify(extractKey))
    const entry = {
      recordId: record.pk,
      itemDetail: {
        sourceBucket: record.sourceBucket,
        params: {
          sourceKey: record.sourceKey,
          extractKey: extractKey
        }
      }
    }
    manifest.push(entry)
  });
  console.log(JSON.stringify(manifest))

  let exportManifest: string = ''
  manifest.forEach(x => {
    const encodeParams = encodeURIComponent(JSON.stringify(x.itemDetail.params))
    const line = `${x.itemDetail.sourceBucket},${encodeParams}`
    exportManifest = exportManifest + line + '\r\n'
  });
  console.log(JSON.stringify(exportManifest))


  const batchIdFile = event.batchFile.substring(event.batchFile.lastIndexOf("/") + 1, event.id.length);
  const batchId = batchIdFile.split('.')[0]
  const manifestKey = `extract/${executionId}/manifest/${batchId}.csv`;
  console.log(JSON.stringify(manifestKey));
  const putObjectReq: S3.PutObjectRequest = {
      Bucket: process.env.AWS_S3_BUCKET_NAME || 'failed to get bucket name',
      Key: manifestKey,
      Body: exportManifest,
      ContentType: 'text/csv',
    };

  const putObject = await s3.putObject(putObjectReq).promise();

  return {
      ETag: putObject.ETag,
      ObjectArn: `arn:aws:s3:::${bucket}/${manifestKey}`
  };

};
