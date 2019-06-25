using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ServiceList.Core;
using ServiceList.Infrastructure;

using Amazon.Lambda.Core;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]

namespace ServiceList.App.AwsCrawl
{
    public class Function
    {
        
        /// <summary>
        /// A simple function that takes a string and does a ToUpper
        /// </summary>
        /// <param name="input"></param>
        /// <param name="context"></param>
        /// <returns></returns>
        public async Task<string> FunctionHandler(string input, ILambdaContext context)
        {
            List<Service> onlineServiceList = await HtmlHelper.ParseAwsServices("https://aws.amazon.com/products/");
            System.Console.WriteLine($"Query online list: {onlineServiceList.Count()}");
            List<Service> masterServiceList = await DynamoHelper.QueryTable();
            System.Console.WriteLine($"Query online list: {masterServiceList.Count()}");

            var areEqual = (masterServiceList.Count == onlineServiceList.Count) && onlineServiceList.Except(masterServiceList).Any();
            System.Console.WriteLine(areEqual);
            return areEqual.ToString();

        }
    }
}
