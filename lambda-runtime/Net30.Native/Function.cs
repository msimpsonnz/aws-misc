using Amazon.Lambda.Core;
using Amazon.Lambda.RuntimeSupport;
using Amazon.Lambda.Serialization.Json;
using System;
using System.Threading.Tasks;
using Amazon.Lambda.ApplicationLoadBalancerEvents;
using System.Collections.Generic;
using FakeResponse;
using System.Text.Json.Serialization;

[assembly: LambdaSerializer(
typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))] 

namespace Net30.Native
{
    public class Function
    {
        /// <summary>
        /// The main entry point for the custom runtime.
        /// </summary>
        /// <param name="args"></param>
        private static async Task Main(string[] args)
        {
            Func<ApplicationLoadBalancerRequest, ILambdaContext, CustomAlbResponse> func = FunctionHandler;
            using(var handlerWrapper = HandlerWrapper.GetHandlerWrapper(func, new Amazon.Lambda.Serialization.Json.JsonSerializer()))
            using(var bootstrap = new LambdaBootstrap(handlerWrapper))
            {
                await bootstrap.RunAsync();
            }
        }

        /// <summary>
        /// A simple function that takes a string and does a ToUpper
        ///
        /// To use this handler to respond to an AWS event, reference the appropriate package from 
        /// https://github.com/aws/aws-lambda-dotnet#events
        /// and change the string input parameter to the desired event type.
        /// </summary>
        /// <param name="input"></param>
        /// <param name="context"></param>
        /// <returns></returns>
        // public static string FunctionHandler(string input, ILambdaContext context)
        // {
        //     return input?.ToUpper();
        // }
        public static CustomAlbResponse FunctionHandler(ApplicationLoadBalancerRequest request, ILambdaContext context)
        {
            System.Console.WriteLine(request.Body.ToString() ?? "Empty Request");
            
            List<Dictionary<string, string>> body = FakeResponseMaker.BuildFakeResponse();
            
            var responseBody = System.Text.Json.JsonSerializer.Serialize<List<Dictionary<string, string>>>(body);

            Dictionary<string, string> Headers = new Dictionary<string, string>();
            Headers.Add("Content-Type", "text/html;");

            CustomAlbResponse response = new CustomAlbResponse()
            {
                IsBase64Encoded = false,
                StatusCode = 200,
                StatusDescription = "200 OK",
                Headers = Headers,
                Body = responseBody
            };

            return response;
        }
    }
}
