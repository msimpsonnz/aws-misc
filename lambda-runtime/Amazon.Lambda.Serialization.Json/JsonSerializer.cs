using System.IO;
using Amazon.Lambda.Core;

namespace Amazon.Lambda.Serialization.Json
{
    public class JsonSerializer : ILambdaSerializer
    {
        public JsonSerializer()
        {

        }

        public T Deserialize<T>(Stream requestStream)
        {
            System.Text.Json.Serialization.JsonSerializerOptions options = new System.Text.Json.Serialization.JsonSerializerOptions() {
                PropertyNameCaseInsensitive = true
            };
            var json = new StreamReader(requestStream).ReadToEnd();
            return System.Text.Json.Serialization.JsonSerializer.Parse<T>(json, options);
        }

        public void Serialize<T>(T response, Stream responseStream)
        {
            System.Text.Json.Serialization.JsonSerializer.WriteAsync<T>(response, responseStream);

        }
    }
}
