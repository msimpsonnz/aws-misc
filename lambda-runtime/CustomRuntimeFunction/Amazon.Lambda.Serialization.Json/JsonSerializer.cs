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
            var json = new StreamReader(requestStream).ReadToEnd();
            return System.Text.Json.Serialization.JsonSerializer.Parse<T>(json);
        }

        public void Serialize<T>(T response, Stream responseStream)
        {
            System.Text.Json.Serialization.JsonSerializer.WriteAsync<T>(response, responseStream);

        }
    }
}
