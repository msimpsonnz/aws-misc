using System.Threading.Tasks;
using System.Collections.Generic;
using ServiceList.Core;
using ServiceList.Infrastructure;

namespace ServiceList.Client
{
    class Program
    {
        static async Task Main(string[] args)
        {
            await GetLatest(false);

        }

        private static async Task GetLatest(bool rebuildTable)
        {
            if (rebuildTable)
            {
                List<Service> onlineServiceList = await HtmlHelper.ParseAwsServices("https://aws.amazon.com/products/");

                List<Service> master = ServiceListHelper.OrderServiceListByShortName(onlineServiceList);

                await DynamoHelper.UpdateTable(master);

                List<Service> serviceList = await DynamoHelper.QueryTable();

                List<Tags> tagList = await HtmlHelper.ParseBlogTags("https://msimpson.co.nz/tags/aws/");

                List<TableEntry> tableList = MarkdownHelper.BuildTable(serviceList, tagList);

                MarkdownHelper.BuildMarkdown(tableList);
            }
            else
            {
                List<Service> serviceList = await DynamoHelper.QueryTable();

                List<Tags> tagList = await HtmlHelper.ParseBlogTags("https://msimpson.co.nz/tags/aws/");

                List<TableEntry> tableList = MarkdownHelper.BuildTable(serviceList, tagList);

                MarkdownHelper.BuildMarkdown(tableList);
            }
        }


    }

}
