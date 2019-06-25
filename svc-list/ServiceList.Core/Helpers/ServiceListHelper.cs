using System.Collections.Generic;
using System.Linq;

namespace ServiceList.Core
{
    public class ServiceListHelper
    {
        public static List<Service> OrderServiceListById(List<Service> serviceList)
        {
            return serviceList.GroupBy(x => x.id).Select(g => g.FirstOrDefault()).OrderBy(x => x.id).ToList();


        }

        public static List<Service> OrderServiceListByShortName(List<Service> serviceList)
        {
            return serviceList.GroupBy(x => x.id).Select(g => g.FirstOrDefault()).OrderBy(x => x.ShortName).ToList();


        }

    }
}