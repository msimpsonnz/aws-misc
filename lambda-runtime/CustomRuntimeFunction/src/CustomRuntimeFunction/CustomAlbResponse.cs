using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace CustomRuntimeFunction
{
    public class CustomAlbResponse
    {
        [JsonPropertyName("statusCode")]
        public long StatusCode { get; set; }

        [JsonPropertyName("statusDescription")]
        public string StatusDescription { get; set; }

        [JsonPropertyName("headers")]
        public Dictionary<string, string> Headers { get; set; }

        [JsonPropertyName("multiValueHeaders")]
        public object MultiValueHeaders { get; set; }

        [JsonPropertyName("body")]
        public string Body { get; set; }

        [JsonPropertyName("isBase64Encoded")]
        public bool IsBase64Encoded { get; set; }
    }

}