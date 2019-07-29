using System;
using Newtonsoft.Json;

namespace ServiceList.Core
{
    public class ServiceEntity : Service
    {
        public ServiceEntity(string service)
        {
            Service serviceObj = JsonConvert.DeserializeObject<Service>(service);

            this.id = serviceObj.id;
            this.ItemType = "product#master";
            this.Name = serviceObj.Name;
            this.ShortName = serviceObj.ShortName;
            this.Description = serviceObj.Description;
            this.Link = serviceObj.Link;
            this.DateUpdated = DateTime.UtcNow.ToString();

        }

        public ServiceEntity(Service serviceObj)
        {
            this.id = serviceObj.id;
            this.ItemType = "product#master";
            this.Name = serviceObj.Name;
            this.ShortName = serviceObj.ShortName;
            this.Description = serviceObj.Description;
            this.Link = serviceObj.Link;
            this.DateUpdated = DateTime.UtcNow.ToString();

        }

        public string ItemType { get; set; }

        public string DateUpdated { get; set; }

    }
}