using System.Collections.Generic;
using Newtonsoft.Json;

namespace Trip.Common
{
    public class JsonHelper
    {
        public static string TripToJson(List<TripModel> tripModelList)
        {
            return JsonConvert.SerializeObject(tripModelList);

        }
    }
}