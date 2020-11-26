import { Handler, Context } from 'aws-lambda';
import { S3Control } from 'aws-sdk';

const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID || 'failed to get env';
const AWS_REGION = process.env.AWS_REGION || 'failed to get env';
const AWS_BATCH_FN_ARN = process.env.AWS_BATCH_FN_ARN || 'failed to get env';
const AWS_BATCH_ROLE_ARN =
  process.env.AWS_BATCH_ROLE_ARN || 'failed to get env';
const bucket = process.env.AWS_S3_BUCKET_NAME || 'failed to get bucket name';

const s3control = new S3Control( { region: AWS_REGION });

export const handler: Handler = async (event: any, context: Context) => {
  console.log(JSON.stringify(event));
  const executionId = event.id.substring(
    event.id.lastIndexOf(':') + 1,
    event.id.length
  );
  let resultJobList = [];
  let jobRequests: S3Control.CreateJobRequest[] = [];

  event.manifests.forEach(
    (manifest: {
      batchFile: string;
      manifests: { Payload: { ETag: any; ObjectArn: any } };
    }) => {
      //for await (const manifest of event.manifests) {
      console.log(JSON.stringify(manifest));
      const batchFile = manifest.batchFile.substring(
        manifest.batchFile.lastIndexOf('/') + 1,
        manifest.batchFile.length
      );
      const batchId = batchFile.split('.')[0];
      const etagEscaped = manifest.manifests.Payload.ETag;
      const etag1 = etagEscaped.replace(/\\/g, '');
      console.log(etag1);
      const etag: string = etagEscaped.replace(/["']/g, '');
      console.log(etag);
      const objectArn = manifest.manifests.Payload.ObjectArn;
      const createJobRequest: S3Control.CreateJobRequest = {
        AccountId: AWS_ACCOUNT_ID,
        ClientRequestToken: `${executionId}-${batchId}`,
        Manifest: {
          Location: {
            ETag: etag,
            ObjectArn: objectArn,
          },
          Spec: {
            Format: 'S3BatchOperations_CSV_20180820',
            Fields: [
                "Bucket","Key" 
            ]
          },
        },
        Operation: {
          LambdaInvoke: {
            FunctionArn: AWS_BATCH_FN_ARN,
          },
        },
        Priority: +batchId,
        Report: {
          Enabled: true,
          Format: 'Report_CSV_20180820',
          ReportScope: 'AllTasks',
          Bucket: `arn:aws:s3:::${bucket}`,
          Prefix: `${executionId}/reports/${batchId}`,
        },
        RoleArn: AWS_BATCH_ROLE_ARN,
        ConfirmationRequired: false,
      };
      console.log(JSON.stringify(createJobRequest));

      jobRequests.push(createJobRequest);
    }
  );

  for await (const job of jobRequests) {
    const batchJob = await s3control.createJob(job).promise();
    console.log(JSON.stringify(batchJob));
    resultJobList.push(batchJob);
  }

  return resultJobList;
};
