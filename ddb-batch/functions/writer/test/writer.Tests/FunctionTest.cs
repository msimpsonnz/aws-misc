using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Xunit;
using Amazon.Lambda.Core;
using Amazon.Lambda.TestUtilities;
using Amazon.Lambda.SQSEvents;
using writer;
using System.Text.Json;

namespace writer.Tests
{
    public class FunctionTest
    {
        [Fact]
        public async Task TestBatch()
        {

            // Invoke the lambda function and confirm the string was upper cased.
            var function = new Function();
            var logger = new TestLambdaLogger();
            var context = new TestLambdaContext();


            var records = new List<SQSEvent.SQSMessage>();
            for (int i = 0; i < 10; i++)
            {
                Guid guid = Guid.NewGuid();
                var id = guid.ToString();
                var body = new DataRecord
                {
                    PK = id,
                    SK = id,
                    Data = id
                };
                var msg = new SQSEvent.SQSMessage
                {
                    Body = JsonSerializer.Serialize(body)
                };
                records.Add(msg);
            }

            var sqsEvent = new SQSEvent
            {
                Records = records
            };


            await function.FunctionHandler(sqsEvent, context);

            //Assert.Contains("Ok", logger.Buffer.ToString());
        }
    }
}
