using System;
using System.IO;
using Xunit;
using JsonSerializer = Amazon.Lambda.Serialization.Json.JsonSerializer;
using Amazon.Lambda.ApplicationLoadBalancerEvents;
using FakeResponse;

namespace Net30.Native.Tests
{
    public class EventTest
    {
        // [Fact]
        // public void ApplicationLoadBalancerRequestSingleValueTest()
        // {
        //     using (var fileStream = File.OpenRead("alb-request-single-value.json"))
        //     {
        //         var serializer = new JsonSerializer();
        //         var evnt = serializer.Deserialize<ApplicationLoadBalancerRequest>(fileStream);

        //         Assert.Equal(evnt.Path, "/");
        //         Assert.Equal(evnt.HttpMethod, "GET");
        //         Assert.Equal(evnt.Body, "not really base64");
        //         Assert.True(evnt.IsBase64Encoded);
                
        //         Assert.Equal(2, evnt.QueryStringParameters.Count);
        //         Assert.Equal("value1", evnt.QueryStringParameters["query1"]);
        //         Assert.Equal("value2", evnt.QueryStringParameters["query2"]);
                
        //         Assert.Equal("value1", evnt.Headers["head1"]);
        //         Assert.Equal("value2", evnt.Headers["head2"]);


        //         var requestContext = evnt.RequestContext;
        //         Assert.Equal(requestContext.Elb.TargetGroupArn, "arn:aws:elasticloadbalancing:region:123456789012:targetgroup/my-target-group/6d0ecf831eec9f09");
        //     }
        // }

        [Fact]
        public void ApplicationLoadBalancerRequestSingleValueTest()
        {
            string body = FakeResponseMaker.BuildFakeResponse();
            System.Console.WriteLine(body);
        }
        
    }
}
