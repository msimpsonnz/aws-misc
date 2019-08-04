using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using ThirdParty.BouncyCastle.OpenSsl;

namespace LambdaPay.Client
{
    public class DecryptCard
    {
        public string DecryptCardFromKey(string cipherText, byte[] privateKey)
        {
            var plainText = string.Empty;

            using (var rsa = GetRSACryptoProvider(privateKey))
            {
                var cipherTextBytes = Convert.FromBase64String(cipherText);
                var plainTextBytes = rsa.Decrypt(cipherTextBytes, RSAEncryptionPadding.Pkcs1);
                plainText = Encoding.Unicode.GetString(plainTextBytes);
            }

            return plainText;
        }

        private RSA GetRSACryptoProvider(byte[] pemDataBlob)
        {
            var rsa = RSA.Create();
            rsa.KeySize = 4096;
            try
            {
                PemReader pemReader;
                using (StreamReader pemStreamReader = new StreamReader(new MemoryStream(pemDataBlob), Encoding.UTF8, true))
                {
                    pemReader = new PemReader(pemStreamReader);
                    var rsaParameters = pemReader.ReadPrivatekey();
                    rsa.ImportParameters(rsaParameters);
                    pemReader.Reader.Dispose();
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