using Amazon.Lambda.Core;
using Amazon.Lambda.RuntimeSupport;
using Amazon.Lambda.Serialization.Json;
using System;
using System.Threading.Tasks;
using Amazon.Lambda.ApplicationLoadBalancerEvents;
using System.Collections.Generic;
using FakeResponse;
using Newtonsoft.Json;


[assembly: LambdaSerializer(
typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]

namespace Net30.Newton
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
            using (var handlerWrapper = HandlerWrapper.GetHandlerWrapper(func, new Amazon.Lambda.Serialization.Json.JsonSerializer()))
            using (var bootstrap = new LambdaBootstrap(handlerWrapper))
            {
                await bootstrap.RunAsync();
            }
        }

        public static ApplicationLoadBalancerResponse FunctionHandler(ApplicationLoadBalancerRequest request, ILambdaContext context)
        {
            System.Console.WriteLine(request.Body.ToString() ?? "Empty Request");
            
            List<Dictionary<string, string>> body = FakeResponseMaker.BuildFakeResponse();
            
            var responseBody = JsonConvert.SerializeObject(body);

            Dictionary<string, string> Headers = new Dictionary<string, string>();
            Headers.Add("Content-Type", "text/html;");

            ApplicationLoadBalancerResponse response = new ApplicationLoadBalancerResponse()
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
