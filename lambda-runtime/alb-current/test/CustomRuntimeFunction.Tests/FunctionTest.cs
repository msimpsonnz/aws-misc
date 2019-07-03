using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Xunit;
using Amazon.Lambda.Core;
using Amazon.Lambda.TestUtilities;

using CustomRuntimeFunction;
using Amazon.Lambda.ApplicationLoadBalancerEvents;

namespace CustomRuntimeFunction.Tests
{
    public class FunctionTest
    {

        [Fact]
        public void TestSampleFunction()
        {
            var context = new TestLambdaContext();
            var request = new ApplicationLoadBalancerRequest();
            var response = Function.FunctionHandler(request, context);

            Assert.Equal(200, response.StatusCode);
            Assert.Contains("Hello World from Lambda", response.Body);
        }
    }
}
