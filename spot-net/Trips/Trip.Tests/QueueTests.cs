using System;
using Xunit;
using Trip.Common;
using Trip.Worker;
using Trip.Infra;
using System.Threading.Tasks;

namespace Trip.Tests
{
    public class QueueTests
    {
        [Fact]
        public async Task EmptyQueueStopsJob()
        {
            //arrange
            string sqsQueueUrl = "";

            QueueHelper queueHelper = new QueueHelper();

            //act
            var result = await queueHelper.GetJobFromSQS(sqsQueueUrl);

            //assert
            Assert.Equal(null, result);

        }
    }
}
