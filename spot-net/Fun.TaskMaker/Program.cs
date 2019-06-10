using System;
using Amazon.SQS;
using Amazon;
using System.Collections.Generic;
using Amazon.SQS.Model;
using Newtonsoft.Json;
using System.Threading.Tasks;
using System.Linq;

namespace Fun.TaskMaker
{
    class Program
    {
        static AmazonSQSClient client = new AmazonSQSClient(RegionEndpoint.USEast1);
        static readonly string sqsQueueUrl = "https://sqs.us-east-1.amazonaws.com/383358879677/BatchStack-batchQueue9254F2CB-RK8BYMOKY0R2";

        static async Task Main(string[] args)
        {
            List<SendMessageBatchRequestEntry> masterMessageList = MakeBatch();

            System.Console.WriteLine(masterMessageList.Count);

            var batchMessageList = SplitMasterList(masterMessageList);            

            foreach (var list in batchMessageList)
            {
                await BatchRequests(list);
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

        private static async Task BatchRequests(List<SendMessageBatchRequestEntry> messageList)
        {
            var sendMessageBatchRequest = new SendMessageBatchRequest
            {
                Entries = messageList,
                QueueUrl = sqsQueueUrl
            };

            await SendBatch(sendMessageBatchRequest);
        }

        private static async Task SendBatch(SendMessageBatchRequest sendMessageBatchRequest)
        {
            SendMessageBatchResponse response = await client.SendMessageBatchAsync(sendMessageBatchRequest);
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

        private static List<SendMessageBatchRequestEntry> MakeBatch()
        {
            List<SendMessageBatchRequestEntry> messageList = new List<SendMessageBatchRequestEntry>();
            for (int year = 2018; year <= 2018; year++)
            {
                for (int i = 1; i <= 12; i++)
                {
                    string month = i.ToString();
                    if (i < 10)
                    {
                        month = $"0{i.ToString()}";
                    }
                    Message msg = new Message()
                    {
                        SourceBucketName = "nyc-tlc",
                        SourceKeyName = $"trip data/yellow_tripdata_{year}-{month}.csv",
                        DestBucketName = "mjsdemo-s3"
                    };
                    System.Console.WriteLine(msg.SourceKeyName);
                    string msgString = JsonConvert.SerializeObject(msg);
                    messageList.Add(new SendMessageBatchRequestEntry(Guid.NewGuid().ToString(), msgString));

                }
            }
            return messageList;
        }
    }


    class Message
    {
        public string SourceBucketName { get; set; }
        public string SourceKeyName { get; set; }
        public string DestBucketName { get; set; }
    }
}
