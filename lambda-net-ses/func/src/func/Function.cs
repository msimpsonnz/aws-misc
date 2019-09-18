using System;
using Amazon.Lambda.Core;
using Amazon.Lambda.SimpleEmailEvents;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]

namespace SESEvent
{
    public class Function
    {

        /// <summary>
        /// Parse SES Event to check for SPAM and stop SES Rule Set if detected
        /// </summary>
        /// <param name="evt"></param>
        /// <param name="context"></param>
        /// <returns></returns>
        public Object FunctionHandler(SimpleEmailEvent evt, ILambdaContext context)
        {
            var sesNotification = evt.Records[0].Ses;
            Console.WriteLine(sesNotification.Mail.Source);

            // Check if any spam check failed
            if (sesNotification.Receipt.SPFVerdict.Status == "FAIL"
            || sesNotification.Receipt.DKIMVerdict.Status == "FAIL"
            || sesNotification.Receipt.SpamVerdict.Status == "FAIL"
            || sesNotification.Receipt.VirusVerdict.Status == "FAIL")
            {
                Console.WriteLine("Dropping spam");
                // Stop processing rule set, dropping message
                return new { disposition = "STOP_RULE_SET" };

            }
            else
            {
                return null;
            }

        }
    }
}
