using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Amazon.SQS;
using Amazon.SQS.Model;
using Amazon.Lambda.Core;
using System.Text.Json;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace producer
{
    public class Function
    {
        public async Task FunctionHandler(string evnt, ILambdaContext context)
        {
            await ProcessMessageAsync(evnt, context);
        }

        private async Task ProcessMessageAsync(string evnt, ILambdaContext context)
        {
            var sqsClient = new AmazonSQSClient();
            var sqsQueueUrl = Environment.GetEnvironmentVariable("AWS_SQS_Q_URL");
            int batchSize = int.Parse(evnt);
            List<SendMessageBatchRequestEntry> masterMessageList = MakeBatch(batchSize);

            System.Console.WriteLine(masterMessageList.Count);

            var batchMessageList = SplitMasterList(masterMessageList);            

            foreach (var list in batchMessageList)
            {
                await BatchRequests(sqsClient, list, sqsQueueUrl);
            }
        }


        private static List<List<SendMessageBatchRequestEntry>> SplitMasterList(List<SendMessageBatchRequestEntry> masterMessageList)
        {
            var batchMessageList = new List<List<SendMessageBatchRequestEntry>>();

            while (masterMessageList.Any())
            {
                batchMessageList.Add(masterMessageList.Take(10).ToList());
                masterMessageList = masterMessageList.Skip(10).ToList();
            }

            return batchMessageList;
        }

        private static async Task BatchRequests(IAmazonSQS sqsClient, List<SendMessageBatchRequestEntry> messageList, string sqsQueueUrl)
        {
            var sendMessageBatchRequest = new SendMessageBatchRequest
            {
                Entries = messageList,
                QueueUrl = sqsQueueUrl
            };

            await SendBatch(sqsClient, sendMessageBatchRequest);
        }

        private static async Task SendBatch(IAmazonSQS sqsClient, SendMessageBatchRequest sendMessageBatchRequest)
        {
            SendMessageBatchResponse response = await sqsClient.SendMessageBatchAsync(sendMessageBatchRequest);
            Console.WriteLine("Messages successfully sent:");
            foreach (var success in response.Successful)
            {
                Console.WriteLine("    Message id : {0}", success.MessageId);
                Console.WriteLine("    Message content MD5 : {0}", success.MD5OfMessageBody);
            }

            Console.WriteLine("Messages failed to send:");
            foreach (var failed in response.Failed)
            {
                Console.WriteLine("    Message id : {0}", failed.Id);
                Console.WriteLine("    Message content : {0}", failed.Message);
                Console.WriteLine("    Sender's fault? : {0}", failed.SenderFault);
            }
        }

        private static List<SendMessageBatchRequestEntry> MakeBatch(int batchSize)
        {
            List<SendMessageBatchRequestEntry> messageList = new List<SendMessageBatchRequestEntry>();
            for (int i = 0; i < batchSize; i++)
            {
                Guid guid = Guid.NewGuid();
                var id = guid.ToString();
                var msg = new DataRecord
                {
                    PK = id,
                    SK = id,
                    Data = id
                };
                string msgString = JsonSerializer.Serialize(msg);
                messageList.Add(new SendMessageBatchRequestEntry(id, msgString));


            }
            return messageList;
        }
    }
    public class DataRecord
    {
        public string PK { get; set; }
        public string SK { get; set; }
        public string Data { get; set; }
    }
}
