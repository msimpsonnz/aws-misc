namespace ServiceList.Core
{
    public class Service
    {
        public string id { get; set; }
        public string Name { get; set; }
        public string ShortName { get; set; }
        public string Description { get; set; }
        public string Link { get; set; }

    }

    public class ServiceEntity : Service
    {
        public string ItemType { get; set; }

    }
}