using System;
using System.IO;
using System.Text;
using System.Security.Cryptography;
//using ThirdParty.BouncyCastle.OpenSsl;

using Xunit;

namespace LambdaPay.Tests
{
    public class Secret
    {
        [Fact]
        public void Test1()
        {
            GetRSACryptoProvider("blog.connect.certificate.pem");

        }
        public string LoadAndDecrypt(string fileName, string keyFileName)
        {
            var plainText = string.Empty;

            using (var rsa = GetRSACryptoProvider(keyFileName))
            {
                var cipherText = File.ReadAllText(fileName);
                var cipherTextBytes = Convert.FromBase64String(cipherText);
                var plainTextBytes = rsa.Decrypt(cipherTextBytes, RSAEncryptionPadding.Pkcs1);
                plainText = Encoding.Unicode.GetString(plainTextBytes);
            }

            return plainText;
        }


        // public void EncryptAndSave(string plainText, string fileName, string keyFileName)
        // {
        //     using (var rsa = GetRSACryptoProvider())
        //     {
        //         var plainTextBytes = Encoding.Unicode.GetBytes(plainText);
        //         var cipherTextBytes = rsa.Encrypt(plainTextBytes, RSAEncryptionPadding.Pkcs1);
        //         var cipherText = Convert.ToBase64String(cipherTextBytes);

        //         // Save our encrypted text
        //         File.WriteAllText(fileName, cipherText);

        //         // Export the RSA private key (put this somewhere safe!)
        //         using (var fs = File.Create(keyFileName))
        //         {
        //             using (var pem = new PemWriter(fs))
        //             {
        //                 pem.WritePrivateKey(rsa);
        //             }
        //         }
        //     }
        // }

        private RSA GetRSACryptoProvider(string keyFileName = null)
        {
            var rsa = RSA.Create();

            try
            {
                if (string.IsNullOrEmpty(keyFileName))
                {
                   rsa.KeySize = 4096;
                }
                else
                {
                    using (var privateKey = File.OpenRead(keyFileName))
                    {
                        using (var pem = new PemReader(privateKey))
                        {
                            var rsaParameters = pem.ReadRsaKey();
                            rsa.ImportParameters(rsaParameters);
                        }
                    }
                }
                return rsa;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in GetRSACryptoProvider(): {ex}");
                return null;
            }
        }


    }
}
