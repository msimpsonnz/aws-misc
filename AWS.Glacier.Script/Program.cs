using System;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Configuration.Json;
using Amazon.Glacier;
using Amazon.Glacier.Transfer;
using Amazon.Runtime;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using System.IO;

namespace AWS.Glacier.Script
{
    class Program
    {
        public static IConfiguration config { get; set; }

        static void Main(string[] args)
        {
            var builder = new ConfigurationBuilder()
                .AddJsonFile("appsettings.test.json");

            config = builder.Build();
            Environment.SetEnvironmentVariable("AwsId", config["AwsId"]);
            Environment.SetEnvironmentVariable("AwsSecrect", config["AwsSecrect"]);

            try
            {
                DeleteArchiveAsync(config["vaultName"]).Wait();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"There was an exception: {ex.ToString()}");
            }


        }

        public static async Task DeleteArchiveAsync(string vaultName)
        {
            JObject archiveList = JObject.Parse(File.ReadAllText(@"archiveList.json"));

            try
            {
                var manager = new ArchiveTransferManager(Amazon.RegionEndpoint.APSoutheast2);
                
                foreach (var archiveId in archiveList["ArchiveList"])
                {
                    await manager.DeleteArchiveAsync(vaultName, archiveId["ArchiveId"].ToString());
                    Console.WriteLine(archiveId["ArchiveId"]);
                }

            }
            catch (AmazonGlacierException e) { Console.WriteLine(e.Message); }
            catch (AmazonServiceException e) { Console.WriteLine(e.Message); }
            catch (Exception e) { Console.WriteLine(e.Message); }
        }
    }
}
