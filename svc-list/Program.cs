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

            HttpClient client = new HttpClient();
            var response = await client.GetAsync("https://aws.amazon.com/products/");
            var pageContents = await response.Content.ReadAsStringAsync();
            HtmlDocument pageDocument = new HtmlDocument();
            pageDocument.LoadHtml(pageContents);

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
            var orderedServiceList = serviceList.OrderBy(x => x.ShortName);

            File.ReadAllText("master-svc.json");
            
            var md = orderedServiceList.ToMarkdownTable();
            File.WriteAllText("svc.md", md);


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

        public class Service
        {
            public string id { get; set; }
            public string Name { get; set; }
            public string ShortName { get; set; }
            public string Description { get; set; }
            public string Blog { get; set; }
            public string Link { get; set; }

        }
    }
}
