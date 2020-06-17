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
            request.AuthorizationToken = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6ImF0K2p3dCJ9.eyJuYmYiOjE1OTIyMTY3MzMsImV4cCI6MTU5MjIyMDMzMywiaXNzIjoiaHR0cHM6Ly91ZDg1Y3JzOTM5LmV4ZWN1dGUtYXBpLmFwLXNvdXRoZWFzdC0yLmFtYXpvbmF3cy5jb20vcHJvZCIsImF1ZCI6ImFwaSIsImNsaWVudF9pZCI6ImNsaWVudCIsInNjb3BlIjpbImFwaSJdfQ.bGKaVK1V9M2kGPyK3EFaaNG2h3ceLQJ-1SNv6CZr9y0TUSDaTiNsCcXLVbxVrB2tzXzDn3fBG313uO-T35TlVhGy4EwfZaz2yY0Oh5_mIMvKlYSqA9PjoFQklTZCOsMwX30nVeXh6LPlbuRIA2gvnSEhLOXKr0ydtXA_KQROHGKbimQwbZAuCdPL6LPHX7mffw4nYfBCfZ7J0HL6_-LW8JRccoubsTa6ESnTNoQvoXxKSL2-HA96vku3E9u5kJEgT_BTuPrQ2F4z_s40HSC4iQHY3SMlmpzLVnwrlWD_wBPNO28yCqxY5TjpVv23Q6zHEAIkVwOyiVyhwX6Dz9FRbA";
            context = new TestLambdaContext();
            response = functions.Get(request, context);
            Assert.Equal("", response.PolicyDocument.Version);
        }
    }
}
