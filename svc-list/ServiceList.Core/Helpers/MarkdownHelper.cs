using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

namespace ServiceList.Core
{
    public class MarkdownHelper
    {
        public static void BuildMarkdown(List<TableEntry> tableList)
        {
            int blogToSvc = 0;
            foreach (var item in tableList.Where(x => x.Blog.Length > 0))
            {
                blogToSvc++;
            }

            var basePost = File.ReadAllText("../../msimpsonnz/_drafts/2019-06-17-AWS-AtoZ.md");

            StringBuilder sb = new StringBuilder();
            sb.Append(basePost);
            sb.AppendLine();
            sb.AppendLine("### Service List");
            sb.AppendLine($"#### Last Updated: {DateTime.Now}");
            sb.AppendLine($"#### Blogs: {blogToSvc} Services: {tableList.Count}");
            sb.AppendLine();
            sb.AppendLine(tableList.ToMarkdownTable());

            File.WriteAllText("../../msimpsonnz/_posts/2019-06-17-AWS-AtoZ.md", sb.ToString());
        }

        public static List<TableEntry> BuildTable(List<Service> orderedServiceList, List<Tags> tagList)
        {
            List<TableEntry> tableList = new List<TableEntry>();
            foreach (Service svc in orderedServiceList)
            {
                string[] blogs = tagList.Where(x => x.Tag == svc.ShortName).Select(x => x.Blog).ToArray();

                TableEntry tableEntry = new TableEntry(svc, blogs);

                tableList.Add(tableEntry);

            }

            return tableList;
        }
    }
}