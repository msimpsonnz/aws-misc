using System.Linq;
using System.Threading.Tasks;
using Amazon;
using Amazon.SQS;
using Amazon.SQS.Model;
using Newtonsoft.Json;
using Trip.Common;

namespace Trip.Infra
{
    public class QueueHelper
    {
        public static AmazonSQSClient sqsClient = new AmazonSQSClient(RegionEndpoint.USEast1);


        public async Task<JobDetail> GetJobFromSQS(string sqsQueueUrl)
        {
            //Build message request, only get one message
            var receiveMessageRequest = new ReceiveMessageRequest()
            {
                QueueUrl = sqsQueueUrl,
                MaxNumberOfMessages = 1
            };
            var receiveMessageResponse = await sqsClient.ReceiveMessageAsync(receiveMessageRequest);

            if (receiveMessageResponse.Messages.Count > 0)
            {
                System.Console.WriteLine($"Info: GetSQS, MessageID: {receiveMessageResponse.Messages.FirstOrDefault().MessageId}");
                //Change visibility of message so that nothing else picks up the same job
                await sqsClient.ChangeMessageVisibilityAsync(sqsQueueUrl, receiveMessageResponse.Messages.FirstOrDefault().ReceiptHandle, 40000);
                Message msg = receiveMessageResponse.Messages.FirstOrDefault();
                var jobDetail = JsonConvert.DeserializeObject<JobDetail>(msg.Body);

                jobDetail.MessageId = msg.MessageId;
                jobDetail.ReceiptHandle = msg.ReceiptHandle;
                
                return jobDetail;
            }
            else
            {
                return null;
            }

        }

        public async Task DeleteSQSMessage(string sqsQueueUrl, JobDetail jobDetail)
        {
            await sqsClient.DeleteMessageAsync(sqsQueueUrl, jobDetail.ReceiptHandle);
            System.Console.WriteLine($"Info: Deleted message, MessageID: {jobDetail.MessageId}");

        }
    }
}