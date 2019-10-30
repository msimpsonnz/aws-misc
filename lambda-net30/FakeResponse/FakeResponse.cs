using System;
using System.Collections.Generic;
using System.Text;

namespace FakeResponse
{
    public class FakeResponseMaker
    {
        public static string BuildFakeResponse()
        {
            int iterations = 99;
            int.TryParse(Environment.GetEnvironmentVariable("FakeIterations"), out iterations);
            Console.WriteLine($"Fake Response: Building {iterations} iterations");
            List<Dictionary<string, string>> fakeResponse = new List<Dictionary<string, string>>();
            for (int i = 1; i < iterations; i++)
            {
                Dictionary<string, string> entry = new Dictionary<string, string>() {
                    { Guid.NewGuid().ToString(), Guid.NewGuid().ToString() }
                };
                fakeResponse.Add(entry);
            };

            StringBuilder sb = new StringBuilder();
            sb.Append("[");
            foreach (var r in fakeResponse)
            {
                foreach (var item in r)
                {     
                    {
                        sb.Append("{\"");
                        sb.AppendFormat("{0}", item.Key.ToString());
                        sb.Append("\": \"");
                        sb.AppendFormat("{0}", item.Value.ToString());
                        sb.Append("\" },");

                    }
                }
            }
            sb.Length--;
            sb.Append("]");
            return sb.ToString();

        }
    }
}