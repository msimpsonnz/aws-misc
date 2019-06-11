using System;
using Microsoft.ML;
using Microsoft.ML.Data;

namespace Trip.Common
{
    public class DataHelper
    {
        public static void TripFromCvd(string dataPath)
        {

            // create the machine learning context
            var mlContext = new MLContext();

            // set up the text loader 
            var textLoader = mlContext.Data.CreateTextLoader(
                new TextLoader.Options()
                {
                    Separators = new[] { ',' },
                    HasHeader = true,
                    Columns = new[]
                    {
                    new TextLoader.Column("VendorId", DataKind.String, 0),
                    new TextLoader.Column("RateCode", DataKind.String, 5),
                    new TextLoader.Column("PassengerCount", DataKind.Single, 3),
                    new TextLoader.Column("TripDistance", DataKind.Single, 4),
                    new TextLoader.Column("PaymentType", DataKind.String, 9),
                    new TextLoader.Column("FareAmount", DataKind.Single, 10)
                    }
                }
            );

            // load the data 
            Console.Write("Loading training data....");
            var dataView = textLoader.Load(dataPath);
            Console.WriteLine("done");

        }
    }
}