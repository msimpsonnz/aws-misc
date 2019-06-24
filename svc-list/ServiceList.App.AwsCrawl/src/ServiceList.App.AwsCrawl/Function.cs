using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ServiceList.Core;

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
            List<Service> orderedServiceList = await HtmlHelper.ParseAwsServices("https://aws.amazon.com/products/");
            return orderedServiceList[0].Description;
        }
    }
}
