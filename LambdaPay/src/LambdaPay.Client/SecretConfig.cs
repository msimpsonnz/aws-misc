using System;
using System.IO;
using System.Threading.Tasks;

using Amazon;
using Amazon.SecretsManager;
using Amazon.SecretsManager.Model;
using Newtonsoft.Json;

namespace LambdaPay.Client
{
    public class SecretConfig
    {
        private static AmazonSecretsManagerClient _client;

        public SecretConfig(string region)
        {
             _client = new AmazonSecretsManagerClient(RegionEndpoint.GetBySystemName(region));
        }

        public async Task<Config> GetSecretConfig(string secretName)
        {
            var secrets = await GetSecret(secretName);
            return JsonConvert.DeserializeObject<Config>(secrets);
        }
        
        public async Task<string> GetSecret(string secretName)
        {
            string secret = "";

            MemoryStream memoryStream = new MemoryStream();

            GetSecretValueRequest request = new GetSecretValueRequest();
            request.SecretId = secretName;
            request.VersionStage = "AWSCURRENT"; // VersionStage defaults to AWSCURRENT if unspecified.

            GetSecretValueResponse response = null;

            try
            {
                response = await _client.GetSecretValueAsync(request);
            }
            catch (DecryptionFailureException e)
            {
                // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
                // Deal with the exception here, and/or rethrow at your discretion.
                System.Console.WriteLine(e);
                throw;
            }
            catch (InternalServiceErrorException e)
            {
                // An error occurred on the server side.
                // Deal with the exception here, and/or rethrow at your discretion.
                System.Console.WriteLine(e);
                throw;
            }
            catch (InvalidParameterException e)
            {
                // You provided an invalid value for a parameter.
                // Deal with the exception here, and/or rethrow at your discretion
                System.Console.WriteLine(e);
                throw;
            }
            catch (InvalidRequestException e)
            {
                // You provided a parameter value that is not valid for the current state of the resource.
                // Deal with the exception here, and/or rethrow at your discretion.
                System.Console.WriteLine(e);
                throw;
            }
            catch (ResourceNotFoundException e)
            {
                // We can't find the resource that you asked for.
                // Deal with the exception here, and/or rethrow at your discretion.
                System.Console.WriteLine(e);
                throw;
            }
            catch (System.AggregateException ae)
            {
                // More than one of the above exceptions were triggered.
                // Deal with the exception here, and/or rethrow at your discretion.
                System.Console.WriteLine(ae);
                throw;
            }

            // Decrypts secret using the associated KMS CMK.
            // Depending on whether the secret is a string or binary, one of these fields will be populated.
            if (response.SecretString != null)
            {
                secret = response.SecretString;
                return secret;
            }
            else
            {
                memoryStream = response.SecretBinary;
                StreamReader reader = new StreamReader(memoryStream);
                string decodedBinarySecret = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(reader.ReadToEnd()));
                return decodedBinarySecret;
            }
        }

        
    }

    public class Config
    {
        public string StripeApiKey { get; set; }
        public string Email { get; set; }
    }
}