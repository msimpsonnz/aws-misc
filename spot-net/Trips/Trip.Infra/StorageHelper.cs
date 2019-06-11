using System;
using System.IO;
using System.Threading.Tasks;
using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using Trip.Common;

namespace Trip.Infra
{
    public class StorageHelper
    {
        public static AmazonS3Client s3Client = new AmazonS3Client(RegionEndpoint.USEast1);

        public async Task<string> StreamS3ObjectToString(JobDetail jobDetail)
        {
            string result = string.Empty;
            
            //GetObjectRequest request = new GetObjectRequest()
            string filePath = $"/tmp/{jobDetail.SourceKeyName}";
            TransferUtilityDownloadRequest request = new TransferUtilityDownloadRequest()
            {
                FilePath = filePath,
                BucketName = jobDetail.SourceBucketName,
                Key = jobDetail.SourceKeyName              
            };
            TransferUtility transferUtility = new TransferUtility(s3Client);
            
            await transferUtility.DownloadAsync(request);

            Console.WriteLine($"S3 Request Downloaded");
            using (StreamReader reader = new StreamReader(filePath))
            {
                result = await reader.ReadToEndAsync();
            }
            return result;
        }

        public async Task UploadFile(JobDetail jobDetail, string transformData)
        {
            var putReq = new PutObjectRequest()
            {
                BucketName = jobDetail.DestBucketName,
                Key = $"{jobDetail.AWS_BATCH_JOB_ID}-{DateTime.Now.ToString("yyyy-MM-dd-HH-mm-ss")}-{jobDetail.SourceKeyName}.json",
                ContentBody = transformData,
                ContentType = "application/json"
            };
            var req = await s3Client.PutObjectAsync(putReq);
            System.Console.WriteLine(req.HttpStatusCode);
        }


    }
}
