using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Security.Cryptography.X509Certificates;
using System.Reflection;

using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Microsoft.IdentityModel.Tokens;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]

namespace auth
{
    public class Functions
    {
        /// <summary>
        /// Default constructor that Lambda will invoke.
        /// </summary>
        public Functions()
        {
        }


        /// <summary>
        /// A Lambda function to respond to HTTP Get methods from API Gateway
        /// </summary>
        /// <param name="request"></param>
        /// <returns>The list of blogs</returns>
        public APIGatewayProxyResponse Get(APIGatewayCustomAuthorizerRequest request, ILambdaContext context)
        {
            context.Logger.LogLine("Get Request\n");
            X509Certificate2 cert = new X509Certificate2("idsrv.pfx", "");
            SecurityKey key = new X509SecurityKey(cert);

            var TokenValidationParams = new TokenValidationParameters
            {
                IssuerSigningKey=key,
                // ValidateIssuer=true,
                // ValidIssuer="http://localhost:5000",
                ValidateAudience=true,
                ValidAudience="api",
                ClockSkew=TimeSpan.FromMinutes(5),
                
               
            };

            SecurityToken validatedToken;

            JwtSecurityTokenHandler handler = new JwtSecurityTokenHandler();
            bool authorized = false;

            try
            {
                var token = handler.ValidateToken(request.AuthorizationToken, TokenValidationParams, out validatedToken);
                context.Logger.LogLine($"{token.ToString()}");
            }
            catch (Exception ex)
            {
                context.Logger.LogLine($"Error occurred validating token: {ex.Message}");
            }
        
            context.Logger.LogLine($"{authorized}");

            var response = new APIGatewayProxyResponse
            {
                StatusCode = (int)HttpStatusCode.OK,
                Body = "Hello AWS Serverless",
                Headers = new Dictionary<string, string> { { "Content-Type", "text/plain" } }
            };

            return response;
        }
    }
}
