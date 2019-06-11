namespace Trip.Common
{
    public class JobDetail
    {
        public string AWS_BATCH_JOB_ID { get; set; }
        public string SourceBucketName { get; set; }
        public string SourceKeyName { get; set; }
        public string DestBucketName { get; set; }
        public string MessageId { get; set; }
        public string ReceiptHandle { get; set; }

    }
}