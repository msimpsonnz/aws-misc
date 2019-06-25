using System.Threading.Tasks;
using System.Collections.Generic;
using ServiceList.Core;
using ServiceList.Infrastructure;
using System.Linq;
using System.IO;
using Newtonsoft.Json;

namespace ServiceList.Client
{
    class Program
    {
        static async Task Main(string[] args)
        {
            List<Service> orderedServiceList = await HtmlHelper.ParseAwsServices("https://aws.amazon.com/products/");

            //await DynamoHelper.GetBatchRequest("service-list");
            //await DynamoHelper.QueryTable();
            var rawFile = File.ReadAllText("master-svc.json");
            List<Service> serviceList = JsonConvert.DeserializeObject<List<Service>>(rawFile);
            List<Service> list = serviceList.GroupBy(x => x.id).Select(g => g.FirstOrDefault()).ToList();
            File.WriteAllText("master-svc-new.json", JsonConvert.SerializeObject(list));
            
            // await DynamoHelper.UpdateTable(serviceList);
            // List<Tags> tagList = await HtmlHelper.ParseBlogTags("https://msimpson.co.nz/tags/aws/");

            // List<TableEntry> tableList = MarkdownHelper.BuildTable(orderedServiceList, tagList);

            // MarkdownHelper.BuildMarkdown(tableList);

        }


    }

}
