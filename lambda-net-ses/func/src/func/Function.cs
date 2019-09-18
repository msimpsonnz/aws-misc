using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Amazon.Lambda.Core;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]

namespace func
{
    public class Function
    {

        /// <summary>
        /// Parse SES Event to check for SPAM and stop SES Rule Set if detected
        /// </summary>
        /// <param name="evt"></param>
        /// <param name="context"></param>
        /// <returns></returns>
        public Object FunctionHandler(SESEvent evt, ILambdaContext context)
        {
            var sesNotification = evt.Records[0].ses;
            Console.WriteLine(sesNotification.mail.source);

            // Check if any spam check failed
            if (sesNotification.receipt.spfVerdict.status == "FAIL"
            || sesNotification.receipt.dkimVerdict.status == "FAIL"
            || sesNotification.receipt.spamVerdict.status == "FAIL"
            || sesNotification.receipt.virusVerdict.status == "FAIL")
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
