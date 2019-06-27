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
            //List<Service> onlineServiceList = await HtmlHelper.ParseAwsServices("https://aws.amazon.com/products/");

            //List<Service> master = ServiceListHelper.OrderServiceListByShortName(onlineServiceList);

            List<Service> serviceList = await DynamoHelper.QueryTable();

            List<Tags> tagList = await HtmlHelper.ParseBlogTags("https://msimpson.co.nz/tags/aws/");

            List<TableEntry> tableList = MarkdownHelper.BuildTable(serviceList, tagList);

            MarkdownHelper.BuildMarkdown(tableList);
        }


    }

}
