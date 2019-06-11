using System;
using Xunit;
using Trip.Common;
using Trip.Worker;
using Trip.Infra;
using System.Threading.Tasks;

namespace Trip.Tests
{
    public class StorageTests
    {
        [Fact]
        public async Task UploadFileSuccess()
        {
            //arrange
            JobDetail jobDetail = new JobDetail() {
                AWS_BATCH_JOB_ID = Guid.NewGuid().ToString(),
                SourceBucketName = "mjsaws-demo-s3",
                SourceKeyName = "green_tripdata_2018-01.csv"
            };
            StorageHelper storageHelper = new StorageHelper();

            //act
            var result = await storageHelper.StreamS3ObjectToString(jobDetail);

            //assert
            Assert.NotEqual(null, result);

        }
    }
}
