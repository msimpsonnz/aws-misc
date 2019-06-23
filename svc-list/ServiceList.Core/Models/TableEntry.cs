using System.Text;

namespace ServiceList.Core
{
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
}