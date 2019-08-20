using System.IO;
using Amazon.Lambda.Core;
using Serializer = System.Text.Json.Serialization;

namespace Amazon.Lambda.Serialization.Json
{
    public class JsonSerializer : ILambdaSerializer
    {
        public JsonSerializer()
        {

        }

        public T Deserialize<T>(Stream requestStream)
        {
            var options = new System.Text.Json.JsonSerializerOptions();
            options.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
            options.PropertyNameCaseInsensitive = true;
            var json = new StreamReader(requestStream).ReadToEnd();
            return System.Text.Json.JsonSerializer.Deserialize<T>(json, options);
        }

        public void Serialize<T>(T response, Stream responseStream)
        {
            var options = new System.Text.Json.JsonSerializerOptions();
            options.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
            System.Text.Json.JsonSerializer.SerializeAsync<T>(responseStream, response, options);

        }
    }
}
