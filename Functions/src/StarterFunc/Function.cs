using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;

using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Amazon;
using Amazon.SQS;
using Amazon.SQS.Model;
using Newtonsoft.Json;


// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]

namespace StarterFunc
{
    public class Functions
    {
        AmazonSQSClient client = new AmazonSQSClient(RegionEndpoint.APSoutheast2);
        /// <summary>
        /// Default constructor that Lambda will invoke.
        /// </summary>
        public Functions()
        {
        }


        /// <summary>
        /// A Lambda function to respond to HTTP Get methods from API Gateway
        /// </summary>
        /// <param name="request"></param>
        /// <returns>The list of blogs</returns>
        public async Task<APIGatewayProxyResponse> Get(APIGatewayProxyRequest request, ILambdaContext context)
        //public APIGatewayProxyResponse Get(APIGatewayProxyRequest request, ILambdaContext context)
        {
            context.Logger.LogLine("Get Request\n");
            context.Logger.LogLine("Some additional log?\n");
            // context.Logger.LogLine(request.Body);

            var requestBody = JsonConvert.DeserializeObject<Message>(request.Body);

            for (int i = 0; i < requestBody.Batch; i++)
            {
                string messageId = await QueueMessage(context, requestBody.Url);
            }         
            try
            {
                var response = new APIGatewayProxyResponse
                {
                    StatusCode = (int)HttpStatusCode.OK,
                    Body = $"Sent Messages: {requestBody.Batch}",
                    //Body = $"Ok",
                    Headers = new Dictionary<string, string> { { "Content-Type", "text/plain" } }
                };

                return response;

            }
            catch (Exception ex)
            {
                context.Logger.LogLine($"Error: {ex.Message}");
                throw;
            }


        }

        private async Task<string> QueueMessage(ILambdaContext context, string url)
        {
            try
            {

                string myQueueURL = "https://sqs.ap-southeast-2.amazonaws.com/632298589294/mjsdemo-sqs";

                var request = new SendMessageRequest
                {
                    DelaySeconds = (int)TimeSpan.FromSeconds(5).TotalSeconds,
                    MessageBody = url,
                    QueueUrl = myQueueURL
                };

                context.Logger.LogLine("Send message\n");
                var response = await client.SendMessageAsync(request);
                context.Logger.LogLine("Message sent\n");
                return response.MessageId;

            }
            catch (Exception ex)
            {
                context.Logger.LogLine($"Error: {ex.Message}");
                throw;
            }

        }
    }
}
