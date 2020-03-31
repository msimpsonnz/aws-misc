using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;

using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;

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
        public APIGatewayProxyResponse Get(APIGatewayProxyRequest request, ILambdaContext context)
        {
            context.Logger.LogLine("Get Request\n");

            var TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer=true,
                ValidIssuer=SecurityConstants.Issuer,
                ValidateAudience=true,
                ClockSkew=TimeSpan.FromMinutes(5),
               
            };

            SecurityToken validatedToken;

            JwtSecurityTokenHandler handler = new JwtSecurityTokenHandler();
            bool authorized = false;

            if (!string.IsNullOrWhiteSpace(apigAuthRequest.AuthorizationToken))
            {
                try
                {
                    var user = handler.ValidateToken(apigAuthRequest.AuthorizationToken, TokenValidationParameters, out validatedToken);
                    var claim = user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name);
                    if (claim != null)
                        authorized = claim.Value == SecurityConstants.ClaimName; // Ensure that the claim value matches the assertion
                }
                catch (Exception ex)
                {
                    context.Logger.LogLine($"Error occurred validating token: {ex.Message}");
                }
            }

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
