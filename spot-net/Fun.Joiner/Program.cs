using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Fun.Joiner
{
    class Program
    {
        static async Task Main(string[] args)
        {
            var client = new AmazonS3Client(RegionEndpoint.APSoutheast2);
            var endWaitHandle = new AutoResetEvent(false);
            using (var eventStream = await GetSelectObjectContentEventStream(client, "mjsaws-demo-s3", "snip.csv"))
            {
                JArray results = new JArray();
                    using (var reader = new StreamReader(eventStream))
                    {
                        results.Add(reader.ReadToEnd());
                        System.Console.WriteLine(results);
                        await NewMethod(client, results);
                    }
            }
        }

        private static async Task NewMethod(AmazonS3Client client, JArray results)
        {
            Console.WriteLine(results);
            var putReq = new PutObjectRequest()
            {
                BucketName = "mjsaws-demo-s3",
                Key = "snip.json",
                ContentBody = results.ToString(),
                ContentType = "application/json"
            };
            var req = await client.PutObjectAsync(putReq);
            System.Console.WriteLine(req.HttpStatusCode);
        }

        private static async Task<ISelectObjectContentEventStream> GetSelectObjectContentEventStream(AmazonS3Client _client, string _bucketName, string _keyName)
        {
            var response = await _client.SelectObjectContentAsync(new SelectObjectContentRequest()
            {
                Bucket = _bucketName,
                Key = _keyName,
                ExpressionType = ExpressionType.SQL,
                Expression = "select VendorID, lpep_pickup_datetime from S3Object",
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
    }
}
