using System;
using System.Collections.Generic;

namespace FakeResponse
{
    public class FakeResponseMaker
    {
        public static List<Dictionary<string, string>> BuildFakeResponse()
        {
            List<Dictionary<string, string>> fakeResponse = new List<Dictionary<string, string>>();
            for (int i = 0; i < 99; i++)
            {
                Dictionary<string, string> entry = new Dictionary<string, string>() {
                    { Guid.NewGuid().ToString(), Guid.NewGuid().ToString() }
                };
                fakeResponse.Add(entry);
            }
            return fakeResponse;

        }
    }
}