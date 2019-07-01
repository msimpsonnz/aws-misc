using Amazon.Lambda.Core;
using Amazon.Lambda.RuntimeSupport;
using Amazon.Lambda.Serialization.Json;
using System;
using System.Threading.Tasks;

namespace lambda_runtime
{
    /// <summary>
    /// The Main function can be used to run the ASP.NET Core application locally using the Kestrel webserver.
    /// It is now also the main entry point for the custom runtime.
    /// </summary>
    public class LocalEntryPoint
    {
        private static readonly LambdaEntryPoint LambdaEntryPoint = new LambdaEntryPoint();
        private static readonly Func<string, ILambdaContext, Task<string>> Func = LambdaEntryPoint.FunctionHandler;

        public static async Task Main(string[] args)
        {
            // Wrap the FunctionHandler method in a form that LambdaBootstrap can work with.
            using (var handlerWrapper = HandlerWrapper.GetHandlerWrapper(Func, new JsonSerializer()))

            // Instantiate a LambdaBootstrap and run it.
            // It will wait for invocations from AWS Lambda and call the handler function for each one.
            using (var bootstrap = new LambdaBootstrap(handlerWrapper))
            {
                await bootstrap.RunAsync();
            }

        }
    }

    public class LambdaEntryPoint
    {
        public async Task<string> FunctionHandler(string input, ILambdaContext context)
        {
            return input?.ToUpper();
        }
    }
}
