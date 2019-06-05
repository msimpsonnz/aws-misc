using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Amazon;
using Amazon.S3;
using Amazon.S3.Model;

namespace Fun.Joiner
{
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("Hello World!");
            var client = new AmazonS3Client(RegionEndpoint.USEast1);
            using (var eventStream = await GetSelectObjectContentEventStream(client, "nyc-tlc", "trip data/yellow_tripdata_2013-01.csv"))
            {
                var recordResults = eventStream
                    .Where(ev => ev is RecordsEvent)
                    .Cast<RecordsEvent>()
                    .Select(records =>
                    {
                        using (var reader = new StreamReader(records.Payload))
                        {
                            return reader.ReadToEnd();
                        }
                    }).ToArray();
                var results = string.Join(Environment.NewLine, recordResults);
                Console.WriteLine(results);
            }

        }

        private static async Task<ISelectObjectContentEventStream> GetSelectObjectContentEventStream(AmazonS3Client _client, string _bucketName, string _keyName)
        {
            var response = await _client.SelectObjectContentAsync(new SelectObjectContentRequest()
            {
                Bucket = _bucketName,
                Key = _keyName,
                ExpressionType = ExpressionType.SQL,
                Expression = "select * from S3Object",
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
