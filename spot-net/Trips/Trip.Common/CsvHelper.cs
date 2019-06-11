using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using TinyCsvParser;
using TinyCsvParser.Mapping;

namespace Trip.Common
{
    public class CsvHelper
    {
        public List<TripModel> TripCsvMapper(string csvString)
        {

            CsvParserOptions csvParserOptions = new CsvParserOptions(true, ',');
            var csvParser = new CsvParser<TripModel>(csvParserOptions, new TripCsvMapping());
            CsvReaderOptions csvReaderOptions = new CsvReaderOptions(new[] { "\r\n", "\r", "\n" });
            var records = csvParser.ReadFromString(csvReaderOptions, csvString);

            return records.Select(x => x.Result).ToList();
        }
    }

    public class TripCsvMapping : CsvMapping<TripModel>
    {
        public TripCsvMapping() : base()
        {
            MapProperty(0, x => x.VendorID);
            MapProperty(1, x => x.lpep_pickup_datetime);
            MapProperty(2, x => x.lpep_dropoff_datetime);
            MapProperty(3, x => x.store_and_fwd_flag);
            MapProperty(4, x => x.RatecodeID);
            MapProperty(5, x => x.PULocationID);
        }
    }

}