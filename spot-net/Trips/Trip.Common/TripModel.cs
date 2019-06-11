using Microsoft.ML.Data;

namespace Trip.Common
{
    public class TripModel
    {
        [LoadColumn(0)]
        public string VendorID { get; set; }

        [LoadColumn(1)]
        public string lpep_pickup_datetime { get; set; }

        [LoadColumn(2)]
        public string lpep_dropoff_datetime { get; set; }

        [LoadColumn(3)]
        public string store_and_fwd_flag { get; set; }

        [LoadColumn(4)]
        public int RatecodeID { get; set; }

        [LoadColumn(5)]
        public int PULocationID { get; set; }

        [LoadColumn(6)]
        public int DOLocationID { get; set; }

        [LoadColumn(7)]
        public int passenger_count { get; set; }

        [LoadColumn(8)]
        public float trip_distance { get; set; }

        [LoadColumn(9)]
        public float fare_amount { get; set; }

        [LoadColumn(10)]
        public float extra { get; set; }

        [LoadColumn(11)]
        public float mta_tax { get; set; }

        [LoadColumn(12)]
        public float tip_amount { get; set; }

        [LoadColumn(13)]
        public float tolls_amount { get; set; }

        [LoadColumn(14)]
        public string ehail_fee { get; set; }

        [LoadColumn(15)]
        public float improvement_surcharge { get; set; }

        [LoadColumn(16)]
        public float total_amount { get; set; }

        [LoadColumn(17)]
        public int payment_type { get; set; }
        
        [LoadColumn(18)]
        public int trip_type { get; set; }

    }
}