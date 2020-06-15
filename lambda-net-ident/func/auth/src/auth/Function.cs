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
using System.Security.Cryptography;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]

namespace auth
{
    public class Functions
    {

        static readonly string ablUrl = Environment.GetEnvironmentVariable("AWS_ALB_URL");

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
        public APIGatewayCustomAuthorizerResponse Get(APIGatewayCustomAuthorizerRequest request, ILambdaContext context)
        {          
            context.Logger.LogLine("Get Request\n");
            context.Logger.LogLine(request.AuthorizationToken.ToString());
            context.Logger.LogLine(ablUrl);
            var accessToken = request.AuthorizationToken.Substring("Bearer ".Length).Trim();
            context.Logger.LogLine(accessToken);
            RSA publicRsa = RSA.Create();  
            publicRsa.FromXmlString("<RSAKeyValue><Modulus>niwszppYY81jN+LO9riMlDVFXCuChYK4NpmnhV7SjRksFfs397jYu07fcGNVWEBppeJ1WZEFILypPjRRfARgwKa4Lu0633cPYG+amyKRYgTGyvbEjvWJ/yvyqimuPrbrI8Bv6FemwCrOoxYIST0pwEHPx6f8SMxKAE9nXP5xcshrudNUZkK9/B17T1HLk9uAzg52cPIM0SChrhfsklcToaycrUQgtFLYWdVEacaSXNo4q1G2ItgHqhM6vHQ5SMcrQ7O+7hlyD5dXkIXItHY4KlHx6yhBp6o0C2237cjIpP1bJaaarFYkHIyWnJ4BET5JXhgVx8j4N6T4S5cNsuy0Rw==</Modulus><Exponent>AQAB</Exponent></RSAKeyValue>");
            RsaSecurityKey signingKey = new RsaSecurityKey(publicRsa);
            bool authorized = false;
            var tokenHandler = new JwtSecurityTokenHandler();
            	try
	{
		tokenHandler.ValidateToken(accessToken, new TokenValidationParameters
		{
			ValidateIssuerSigningKey = true,
			ValidateIssuer = false,
			ValidateAudience = true,
            ValidAudience="api",
			IssuerSigningKey = signingKey,
            ClockSkew=TimeSpan.FromMinutes(5),
		}, out SecurityToken validatedToken);
        authorized = true;
	}
	catch (Exception ex)
	{
		context.Logger.LogLine(ex.Message);
	}
	



            // var TokenValidationParams = new TokenValidationParameters
            // {
            //     //IssuerSigningKey=signingKey,
            //     ValidateIssuer=false,
            //     ValidIssuer=ablUrl,
            //     ValidateAudience=false,
            //     ValidAudience="api",
            //     ClockSkew=TimeSpan.FromMinutes(5),
                
               
            // };

            // SecurityToken validatedToken;

            // JwtSecurityTokenHandler handler = new JwtSecurityTokenHandler();
            

            // try
            // {
            //     var token = handler.ValidateToken(accessToken, TokenValidationParams, out validatedToken);
            //     foreach (Claim claim in token.Claims){
            //         context.Logger.LogLine($"CLAIM TYPE: {claim.Type} CLAIM VALUE: {claim.Value}");  
            //     }  
            //     var getClaimIss = token.Claims.FirstOrDefault(c => c.Type == "iss");
            //     context.Logger.LogLine($"{getClaimIss}");  
            //     if (getClaimIss != null){
            //         authorized = true;
            //     }
            // }
            // catch (Exception ex)
            // {
            //     context.Logger.LogLine($"Error occurred validating token: {ex.Message}");
            // }
        
            context.Logger.LogLine($"{authorized}");

            APIGatewayCustomAuthorizerPolicy policy = new APIGatewayCustomAuthorizerPolicy
            {
                Version = "2012-10-17",
                Statement = new List<APIGatewayCustomAuthorizerPolicy.IAMPolicyStatement>()
            };

            policy.Statement.Add(new APIGatewayCustomAuthorizerPolicy.IAMPolicyStatement
            {
                Action = new HashSet<string>(new string[] { "execute-api:Invoke" }),
                Effect = authorized ? "Allow" : "Deny",
                Resource = new HashSet<string>(new string[] { request.MethodArn })
              
            });

           
            APIGatewayCustomAuthorizerContextOutput contextOutput = new APIGatewayCustomAuthorizerContextOutput();
            contextOutput["User"] = "User";
            contextOutput["Path"] = request.MethodArn;

            return new APIGatewayCustomAuthorizerResponse
            {
                PrincipalID = "User",
                Context = contextOutput,
                PolicyDocument = policy
            };
        }
    }
}
