using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Xunit;
using Amazon.Lambda.Core;
using Amazon.Lambda.TestUtilities;
using Amazon.Lambda.APIGatewayEvents;
using System.IdentityModel.Tokens.Jwt;

using auth;

namespace auth.Tests
{
    public class FunctionTest
    {
        public FunctionTest()
        {
        }

        [Fact]
        public void TetGetMethod()
        {
            TestLambdaContext context;
            APIGatewayCustomAuthorizerRequest request;
            APIGatewayProxyResponse response;

            Functions functions = new Functions();


            request = new APIGatewayCustomAuthorizerRequest();
            request.AuthorizationToken = "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IkFoMTQ4VjFTYk9sakdldmhoN1paMnciLCJ0eXAiOiJhdCtqd3QifQ.eyJuYmYiOjE1ODU2NDY3MDMsImV4cCI6MTU4NTY1MDMwMywiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo1MDAwIiwiYXVkIjoiYXBpIiwiY2xpZW50X2lkIjoiY2xpZW50Iiwic2NvcGUiOlsiYXBpIl19.mim50XzNVBHCd-KjBj2-plUGI6o4xWZ1bkiNUK0CzSoyjr8vi-pNSslZDfH6spYzrAuAmnnIn3b75Te-BbKZfcV-ZYhoQDtN88XIi0Ri1AEVQ-5OLAs24PoAXox020heohsfqixGUsXkVbF7exU-RztDj-bMFtHi8-hv6JGomEZCvX29AUV1vHKc2R7-SHD8XPcblLObgCOWEv9WyCqkQ-iC6AWyjhMpnV8V3cr-Ugc_1LLL3jadGHDmwnAIl7UQJrYY0zwF262khaB3c_V1Rs-B4Amnwa_qQejAUFpD5rAMDzpefzsNzZ71oHUawgXCDc2YtcbcOhaNxh-MZBC6FA";
            context = new TestLambdaContext();
            response = functions.Get(request, context);
            Assert.Equal(200, response.StatusCode);
            Assert.Equal("Hello AWS Serverless", response.Body);
        }
    }
}
