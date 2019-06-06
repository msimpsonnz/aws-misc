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
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Fun.Joiner
{
    class Program
    {
        static async Task Main(string[] args)
        {
            var client = new AmazonS3Client(RegionEndpoint.APSoutheast2);

            string res = string.Empty;
            using (var eventStream = await GetSelectObjectContentEventStream(client, "mjsaws-demo-s3", "snip.csv"))
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

            //System.Console.WriteLine(sb.ToString());
            //var json = JsonConvert.DeserializeObject(sb.ToString());
            System.Console.WriteLine(json.ToString());
            await UploadFile(client, json);

        }

        private static async Task UploadFile(AmazonS3Client client, JArray results)
        {
            Console.WriteLine(results);
            var putReq = new PutObjectRequest()
            {
                BucketName = "mjsaws-demo-s3",
                Key = $"{DateTime.Now.ToString("yyyy-MM-dd-HH-mm-ss")}.json",
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
