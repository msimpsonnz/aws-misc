using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ServiceList.Core;
using ServiceList.Infrastructure;

using Amazon.Lambda.Core;
using Amazon.Lambda.CloudWatchEvents.ScheduledEvents;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]

namespace ServiceList.App.AwsCrawl
{
    public class Function
    {
        static readonly string sqlQueueUrl = Environment.GetEnvironmentVariable("AWS_SQS_URL");

        public async Task<string> FunctionHandler(ScheduledEvent cloudWatchEvent, ILambdaContext context)
        {
            System.Console.WriteLine($"EventId: {cloudWatchEvent.Id}");
            List<Service> onlineServiceList = await HtmlHelper.ParseAwsServices("https://aws.amazon.com/products/");
            System.Console.WriteLine($"Query online list: {onlineServiceList.Count()}");
            List<Service> masterServiceList = await DynamoHelper.QueryTable();
            System.Console.WriteLine($"Query online list: {masterServiceList.Count()}");

            var sendNotifcation = await MessageHelper.SendNotification(onlineServiceList, masterServiceList, sqlQueueUrl);
            System.Console.WriteLine($"Compare Result: {sendNotifcation}");
            

            return sendNotifcation;

        }
    }
}
