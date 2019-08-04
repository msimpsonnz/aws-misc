using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using LambdaPay.Client;
using ThirdParty.BouncyCastle.OpenSsl;

namespace LambdaPay.Tester
{
    class Program
    {
        static async Task Main(string[] args)
        {
            // var _secretClient = new SecretConfig("ap-southeast-2");
            // var secret = await _secretClient.GetSecretConfig("Connect");
            // Console.WriteLine(secret.StripeApiKey);
            // Console.WriteLine(secret.Email);
            // string card = "4242424242424242";
            // string email = secret.Email;

            // var _stripePayment = new StripePayment(secret.StripeApiKey);
            // var paid = _stripePayment.MakePayment(card, email);
            // Console.WriteLine(paid);

            //var pem = File.ReadAllText("blog.connect.certificate.pem");
            //RSA pk = GetRSACryptoProvider(pem);
            ReadAsymmetricKeyParameter("blog.connect.certificate.pem");
        }

        private static RSA ReadAsymmetricKeyParameter(string pemFilename)
        {
            var rsa = RSA.Create();
            rsa.KeySize = 4096;
            PemReader pemReader;
            //var fileStream = File.OpenText(pemFilename);
            var privateKey = File.OpenRead(pemFilename);

            using (StreamReader pemStreamReader = new StreamReader(privateKey))
            {
                pemReader = new PemReader(pemStreamReader);
                var pemObject = pemReader.ReadObject();
                while (pemObject != null)
                {
                    privateKey = pemObject as RsaPrivateCrtKeyParameters;
                    if (privateKey != null)
                    {
                        break;
                    }
                }

            }
            return rsa;
        }

            // private static RSA GetRSACryptoProvider(string pemDataBlob)
            // {
            //     var rsa = RSA.Create();
            //     rsa.KeySize = 4096;
            //     try
            //     {
            //         PemReader pemReader;
            //         pemReader = new PemReader();
            //         var rsaParameters = pemReader.ReadPrivatekey();
            //         rsa.ImportParameters(rsaParameters);
            //         pemReader.Reader.Dispose();

            //         return rsa;
            //     }
            //     catch (Exception ex)
            //     {
            //         Console.WriteLine($"Exception in GetRSACryptoProvider(): {ex}");
            //         return null;
            //     }
            // }

        }
    }
