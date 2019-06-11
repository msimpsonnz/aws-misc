using System;
using System.Threading.Tasks;
using Trip.Common;
using Trip.Infra;

namespace Trip.Worker
{
    class Program
    {
        public static readonly string AWS_BATCH_JOB_ID = Environment.GetEnvironmentVariable("AWS_BATCH_JOB_ID");
        public static readonly string SQS_QUEUE_URL = Environment.GetEnvironmentVariable("SQS_QUEUE_URL");

        public static QueueHelper queueHelper = new QueueHelper();
        public static StorageHelper storageHelper = new StorageHelper();
        static async Task Main(string[] args)
        {
            await RunJob();

        }

        private static async Task RunJob()
        {
            //Grab a message from SQS to kick off the job
            JobDetail jobDetail = await GetJob();
            jobDetail.AWS_BATCH_JOB_ID = AWS_BATCH_JOB_ID;

            while (jobDetail != null)
            {
                //Query S3 and return a stream
                string transformData = await TransformData(jobDetail);
                //Save the result back to another bucket
                await SaveTransform(jobDetail, transformData);
                //Delete the SQS message as we are done
                await MarkJobComplete(jobDetail);
            }
        }

        private static async Task MarkJobComplete(JobDetail jobDetail)
        {
            await queueHelper.DeleteSQSMessage(SQS_QUEUE_URL, jobDetail);
        }

        private static async Task SaveTransform(JobDetail jobDetail, string transformData)
        {
            await storageHelper.UploadFile(jobDetail, transformData);
        }

        private static async Task<string> TransformData(JobDetail jobDetail)
        {
            return await storageHelper.StreamS3ObjectToString(jobDetail);
        }

        private static async Task<JobDetail> GetJob()
        {
            return await queueHelper.GetJobFromSQS(SQS_QUEUE_URL);
        }

    }
}
