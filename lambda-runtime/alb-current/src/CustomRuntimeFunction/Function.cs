using Amazon.Lambda.Core;
using Amazon.Lambda.RuntimeSupport;
using Amazon.Lambda.Serialization.Json;
using System;
using System.Threading.Tasks;
using Amazon.Lambda.ApplicationLoadBalancerEvents;
using System.Collections.Generic;


[assembly: LambdaSerializer(
typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]

namespace CustomRuntimeFunction
{
    public class Function
    {
        /// <summary>
        /// The main entry point for the custom runtime.
        /// </summary>
        /// <param name="args"></param>
        private static async Task Main(string[] args)
        {
            Func<ApplicationLoadBalancerRequest, ILambdaContext, ApplicationLoadBalancerResponse> func = FunctionHandler;
            using (var handlerWrapper = HandlerWrapper.GetHandlerWrapper(func, new JsonSerializer()))
            using (var bootstrap = new LambdaBootstrap(handlerWrapper))
            {
                await bootstrap.RunAsync();
            }
        }

        public static ApplicationLoadBalancerResponse FunctionHandler(ApplicationLoadBalancerRequest request, ILambdaContext context)
        {
            System.Console.WriteLine(request.Body.ToString() ?? "Empty Request");
            string responseString = @"hello world";

            Dictionary<string, string> Headers = new Dictionary<string, string>();
            Headers.Add("Content-Type", "text/html;");

            ApplicationLoadBalancerResponse response = new ApplicationLoadBalancerResponse()
            {
                IsBase64Encoded = false,
                StatusCode = 200,
                StatusDescription = "200 OK",
                Headers = Headers,
                Body = responseString
            };

            return response;
        }
    }
}
