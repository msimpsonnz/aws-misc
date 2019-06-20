using System;
using System.Threading.Tasks;
using System.Net.Http;
using HtmlAgilityPack;
using System.Collections.Generic;
using Newtonsoft.Json;
using System.Linq;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace svc_list
{
    class Program
    {
        static async Task Main(string[] args)
        {
            HtmlDocument awsPageDocument = await GetHtmlfromSite("https://aws.amazon.com/products/");

            List<Service> orderedServiceList = ParseAwsServices(awsPageDocument);

            HtmlDocument blogPageDocument = await GetHtmlfromSite("https://msimpson.co.nz/tags/aws/");

            List<Tags> tagList = ParseBlogTags(blogPageDocument);

            List<TableEntry> tableList = BuildTable(orderedServiceList, tagList);

            BuildMarkdown(tableList);

        }

        private static void BuildMarkdown(List<TableEntry> tableList)
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

        private static List<TableEntry> BuildTable(List<Service> orderedServiceList, List<Tags> tagList)
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

        private static List<Tags> ParseBlogTags(HtmlDocument pageDocument)
        {
            var rawTags = pageDocument.DocumentNode.SelectNodes("(//div[contains(@class,'tags')]/*)");

            List<Tags> tagList = new List<Tags>();
            foreach (HtmlNode item in rawTags)
            {
                var link = item.FirstChild.Attributes["href"].Value;
                foreach (var i in item.ChildNodes)
                {
                    if (i.Name == "ul")
                    {
                        Tags tags = new Tags();
                        tags.id = HashString(i.InnerText + link);
                        tags.Tag = i.InnerText;
                        tags.Blog = $"https://msimpson.co.nz{link}";
                        tagList.Add(tags);
                    }

                }
            }
            return tagList;
        }

        private static List<Service> ParseAwsServices(HtmlDocument pageDocument)
        {
            var rawServices = pageDocument.DocumentNode.SelectNodes("(//div[contains(@class,'lb-content-item')]/*)");

            List<Service> serviceList = new List<Service>();
            foreach (HtmlNode item in rawServices)
            {
                var link = item.Attributes["href"].Value.Split('?')[0];
                Service service = new Service();
                service.id = HashString(link);
                service.ShortName = item.Attributes["href"].Value.Split('/')[1];
                service.Name = item.FirstChild.InnerText.Trim();
                service.Description = item.ChildNodes["span"].InnerText;
                service.Link = $"https://aws.amazon.com{link}";
                serviceList.Add(service);

            }
            List<Service> orderedServiceList = serviceList.OrderBy(x => x.ShortName).ToList();

            var masterFile = File.ReadAllText("master-svc.json");
            List<Service> masterList = JsonConvert.DeserializeObject<List<Service>>(masterFile);

            var areEqual = (masterList.Count == serviceList.Count) && orderedServiceList.Except(masterList).Any();

            if (!areEqual)
            {
                System.Console.WriteLine("Service List has changed!");
                var error = orderedServiceList.Except(masterList).ToList();
                File.WriteAllText("error.json", JsonConvert.SerializeObject(error));
                throw new SystemException();
            }

            return orderedServiceList;
        }

        private static async Task<HtmlDocument> GetHtmlfromSite(string url)
        {
            HttpClient client = new HttpClient();
            var response = await client.GetAsync(url);
            var pageContents = await response.Content.ReadAsStringAsync();
            HtmlDocument pageDocument = new HtmlDocument();
            pageDocument.LoadHtml(pageContents);
            return pageDocument;
        }

        public static string HashString(string id)
        {
            SHA256 sha256Hash = SHA256.Create();
            // ComputeHash - returns byte array  
            byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(id));

            StringBuilder builder = new StringBuilder();
            for (int i = 0; i < bytes.Length; i++)
            {
                builder.Append(bytes[i].ToString("x2"));
            }
            return builder.ToString();
        }

        public class TableEntry
        {
            public TableEntry(Service service, string[] blogUrl)
            {
                Name = $"[{service.Name}]({service.Link})";
                Description = service.Description;
                Blog = BlobString(blogUrl);
            }

            public string BlobString(string[] blobUrl)
            {
                if (blobUrl.Length > 0)
                {
                    StringBuilder sb = new StringBuilder();
                    foreach (string item in blobUrl)
                    {
                        sb.Append($"{item}<br>");
                    }
                    return sb.ToString();
                }
                else
                {
                    return string.Empty;
                }

            }

            public string Name { get; set; }
            public string Description { get; set; }
            public string Blog { get; set; }
        }

        public class Tags
        {
            public string id { get; set; }
            public string Tag { get; set; }
            public string Blog { get; set; }
        }

        public class Service
        {
            public string id { get; set; }
            public string Name { get; set; }
            public string ShortName { get; set; }
            public string Description { get; set; }
            public string Link { get; set; }

        }
    }
}
