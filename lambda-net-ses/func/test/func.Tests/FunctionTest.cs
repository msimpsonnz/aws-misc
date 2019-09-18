using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Threading.Tasks;

using Xunit;
using Amazon.Lambda.Core;
using Amazon.Lambda.TestUtilities;
using Amazon.Lambda.SimpleEmailEvents;
using Newtonsoft.Json;

using func;

namespace func.Tests
{
    public class FunctionTest
    {
        [Fact]
        public void TestToSESPassFunction()
        {
            var sesEventString = File.ReadAllText("sesEventPass.json");
            SimpleEmailEvent sesEvent = JsonConvert.DeserializeObject<SimpleEmailEvent>(sesEventString);

            var function = new Function();
            var context = new TestLambdaContext();
            var result = function.FunctionHandler(sesEvent, context);

            Assert.Null(result);
        }

        [Fact]
        public void TestToSESFailFunction()
        {
            var sesEventString = File.ReadAllText("sesEventFail.json");
            SimpleEmailEvent sesEvent = JsonConvert.DeserializeObject<SimpleEmailEvent>(sesEventString);
            const string stopRule = "{ disposition = STOP_RULE_SET }";

            var function = new Function();
            var context = new TestLambdaContext();
            var result = function.FunctionHandler(sesEvent, context);

            Assert.Equal(stopRule, result.ToString());
        }
    }
}
