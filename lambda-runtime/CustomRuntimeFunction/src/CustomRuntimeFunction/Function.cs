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
            Func<ApplicationLoadBalancerRequest, ILambdaContext, CustomAlbResponse> func = FunctionHandler;
            using(var handlerWrapper = HandlerWrapper.GetHandlerWrapper(func, new JsonSerializer()))
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
            System.Console.WriteLine(request.Body.ToString());
            var response = new CustomAlbResponse
            {
                StatusCode = 200,
                StatusDescription = "200 OK",
                IsBase64Encoded = false
            };

            // If "Multi value headers" is enabled for the ELB Target Group then use the "response.MultiValueHeaders" property instead of "response.Headers".
            response.Headers = new Dictionary<string, string>
            {
                {"Content-Type", "text/html; charset=utf-8" }
            };

            response.Body =
@"
<html>
    <head>
        <title>Hello World!</title>
        <style>
            html, body {
                margin: 0; padding: 0;
                font-family: arial; font-weight: 700; font-size: 3em;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <p>Hello World from Lambda</p>
    </body>
</html>
";

            return response;
        }
    }
}
