using System.Threading.Tasks;
using System.Collections.Generic;
using ServiceList.Core;

namespace ServiceList.Client
{
    class Program
    {
        static async Task Main(string[] args)
        {
            List<Service> orderedServiceList = await HtmlHelper.ParseAwsServices("https://aws.amazon.com/products/");

            List<Tags> tagList = await HtmlHelper.ParseBlogTags("https://msimpson.co.nz/tags/aws/");

            List<TableEntry> tableList = MarkdownHelper.BuildTable(orderedServiceList, tagList);

            MarkdownHelper.BuildMarkdown(tableList);

        }


    }
}
