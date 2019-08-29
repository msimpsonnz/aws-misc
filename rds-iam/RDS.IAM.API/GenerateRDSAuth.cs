using System;
using Amazon.RDS.Util;

namespace RDS.IAM.API
{
    public class GenerateRDSAuth
    {
        public static string GenerateRDSToken(String hostName, int port, String username)
        {
            var region = Amazon.RegionEndpoint.APSoutheast2;
            var result = RDSAuthTokenGenerator.GenerateAuthToken(region, hostName, port, username);
            return result;
        }

    }
}