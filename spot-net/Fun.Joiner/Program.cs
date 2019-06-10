using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.SQS;
using Amazon.SQS.Model;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Fun.Joiner
{
    class Program
    {
        static AmazonS3Client s3Client = new AmazonS3Client(RegionEndpoint.USEast1);
        static AmazonSQSClient sqsClient = new AmazonSQSClient(RegionEndpoint.USEast1);
        static readonly string sqsQueueUrl = Environment.GetEnvironmentVariable("SQS_QUEUE_URL") ?? $"ERROR: NO ENV SET for : SQS_QUEUE_URL";
        static string AWS_BATCH_JOB_ID = Environment.GetEnvironmentVariable("AWS_BATCH_JOB_ID") ?? $"TEST-{Guid.NewGuid().ToString()}";
        static readonly string s3QueryLimit = Environment.GetEnvironmentVariable("S3_QUERY_LIMIT");
        static readonly bool debug = false;

        static async Task Main(string[] args)
        {
            try
            {
                //Grab a message from SQS to kick off the job
                var job = await GetJobFromSQS();
                //Extract the SQS message body to get the job details
                var jobDetail = JsonConvert.DeserializeObject<MessageBody>(job.Body);
                Console.WriteLine(jobDetail.SourceKeyName);
                //Query S3 and return a stream
                var res = await QueryS3(jobDetail);
                //Build a json array from the return string
                JArray json = MakeJsonArray(res);
                //Save the result back to another bucket
                await UploadFile(jobDetail, json);
                //Delete the SQS message as we are done
                await DeleteSQSMessage(job);
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine($"Error: {ex.Message}");
                throw;
            }
        }

        private static async Task DeleteSQSMessage(Message msg)
        {
            await sqsClient.DeleteMessageAsync(sqsQueueUrl, msg.ReceiptHandle);
            System.Console.WriteLine($"Info: Deleted message, MessageID: {msg.MessageId}");

        }

        private static JArray MakeJsonArray(string res)
        {
            JsonTextReader reader = new JsonTextReader(new StringReader(res));
            reader.SupportMultipleContent = true;
            JArray json = new JArray();
            while (true)
            {
                if (!reader.Read())
                {
                    break;
                }

                JsonSerializer serializer = new JsonSerializer();
                JObject jsonResult = serializer.Deserialize<JObject>(reader);

                json.Add(jsonResult);
            }
            if(debug) {
                System.Console.WriteLine(json.ToString());
            }
            return json;
        }

        private static async Task<Message> GetJobFromSQS()
        {
            //Build message request, only get one message
            var receiveMessageRequest = new ReceiveMessageRequest()
            {
                QueueUrl = sqsQueueUrl,
                MaxNumberOfMessages = 1
            };
            var receiveMessageResponse = await sqsClient.ReceiveMessageAsync(receiveMessageRequest);
            
            System.Console.WriteLine($"Info: GetSQS, MessageID: {receiveMessageResponse.Messages.FirstOrDefault().MessageId}");
            //Change visibility of message so that nothing else picks up the same job
            await sqsClient.ChangeMessageVisibilityAsync(sqsQueueUrl, receiveMessageResponse.Messages.FirstOrDefault().ReceiptHandle, 40000);

            return receiveMessageResponse.Messages.FirstOrDefault();

        }

        private static async Task<string> QueryS3(MessageBody msg)
        {
            string res = string.Empty;
            using (var eventStream = await GetSelectObjectContentEventStream(s3Client, msg.SourceBucketName, msg.SourceKeyName))
            {
                foreach (var ev in eventStream)
                {
                    if (ev is RecordsEvent records)
                    {
                        using (var sr = new StreamReader(records.Payload))
                        {
                            res = sr.ReadToEnd();
                        }
                    }
                }
            }

            return res;
        }

        private static async Task UploadFile(MessageBody msg, JArray results)
        {
            Console.WriteLine(results);
            var putReq = new PutObjectRequest()
            {
                BucketName = msg.DestBucketName,
                Key = $"{AWS_BATCH_JOB_ID}-{DateTime.Now.ToString("yyyy-MM-dd-HH-mm-ss")}-{msg.SourceKeyName}.json",
                ContentBody = results.ToString(),
                ContentType = "application/json"
            };
            var req = await s3Client.PutObjectAsync(putReq);
            System.Console.WriteLine(req.HttpStatusCode);
        }

        private static async Task<ISelectObjectContentEventStream> GetSelectObjectContentEventStream(AmazonS3Client _client, string _bucketName, string _keyName)
        {
            var response = await _client.SelectObjectContentAsync(new SelectObjectContentRequest()
            {
                Bucket = _bucketName,
                Key = _keyName,
                ExpressionType = ExpressionType.SQL,
                Expression = $"select * from S3Object{s3QueryLimit}",
                InputSerialization = new InputSerialization()
                {
                    CSV = new CSVInput()
                    {
                        FileHeaderInfo = FileHeaderInfo.Use
                    }
                },
                OutputSerialization = new OutputSerialization()
                {
                    JSON = new JSONOutput()
                }
            });

            return response.Payload;
        }

        class MessageBody
        {
            public string SourceBucketName { get; set; }
            public string SourceKeyName { get; set; }
            public string DestBucketName { get; set; }
        }
    }
}
