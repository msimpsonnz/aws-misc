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
            APIGatewayCustomAuthorizerResponse response;

            Functions functions = new Functions();


            request = new APIGatewayCustomAuthorizerRequest();
            request.AuthorizationToken = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6ImF0K2p3dCJ9.eyJuYmYiOjE1OTIyMTUyNTksImV4cCI6MTU5MjIxODg1OSwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo1MDAwIiwiYXVkIjoiYXBpIiwiY2xpZW50X2lkIjoiY2xpZW50Iiwic2NvcGUiOlsiYXBpIl19.ThkNwMdNwVIPhdipNQE3Oh7VPjdJSFF_VdXbPEs97oNy_d1NfYSSa_VbItiqQiTJzvGn2KxqtbvSZVZ6VlvIjnsTApKJcdMEKHYYeEqicZ0ZPbpXEwZFNW5LpGa4qf_hk7ia50zfijxK44w6NVRbdQmVZJJyZwP_wcDfrB6gKx_Hcm6nDsPBiOlSXZaQw47FolGv7MM80IuB7kEydxaqOuBIG3YTz4ir9eGB_llQJXmtBZ5MfLjjFjfyw_KpqyipHGgwEOtBDtzCiLJlW1f00rx8aZFRYfTl-2auFBc7Y8AeolVq0X-yap89-ar7VTakl_vHNI9Y1DQ139r1yYiSPw";
            context = new TestLambdaContext();
            response = functions.Get(request, context);
            Assert.Equal("", response.PolicyDocument.Version);
        }
    }
}
