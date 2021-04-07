using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.Model;
using Amazon.Lambda.Core;
using Amazon.Lambda.SQSEvents;
using System.Text.Json;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace writer
{
    public class Function
    {
        public AmazonDynamoDBClient client;
        public DynamoDBContext dynamoDBContext;

        public Function()
        {
            this.client = new AmazonDynamoDBClient();
            this.dynamoDBContext = new DynamoDBContext(client);
        }

        public async Task FunctionHandler(SQSEvent evnt, ILambdaContext context)
        {
            await ProcessMessageAsync(evnt, context);
        }

        private async Task ProcessMessageAsync(SQSEvent evnt, ILambdaContext context)
        {
            var mode = Environment.GetEnvironmentVariable("MODE");
            var table = Environment.GetEnvironmentVariable("AWS_DYNAMODB_TABLE");
            //var mode = "BATCH";
            //var table = "demo-shared-demosharedtableD8015239-8NAK94NTMY7H";
            //do conditional write
            if (mode == "COND")
            {
                System.Console.WriteLine(mode);
                foreach (var msg in evnt.Records)
                {
                    var rec = JsonSerializer.Deserialize<DataRecord>(msg.Body);
                    System.Console.WriteLine(rec.Data.ToString());
                    PutItemRequest updateRequest = new PutItemRequest()
                    {
                        TableName = table,
                        Item = new Dictionary<string, AttributeValue>
                        {
                            { "pk", new AttributeValue { S = rec.PK } },
                            { "sk", new AttributeValue { S = rec.SK } },
                            { "data1", new AttributeValue { S = rec.Data } },
                            { "list", new AttributeValue { L = new List<AttributeValue>
                                {   new AttributeValue { S = rec.Data },
                                    new AttributeValue { S = rec.Data } }
                                }
                            }
                        },
                        ConditionExpression = "attribute_not_exists (data1)",
                    };

                    try
                    {
                        await client.PutItemAsync(updateRequest);
                        context.Logger.LogLine("OK");
                    }
                    catch (Exception ex)
                    {
                        System.Console.WriteLine(ex.Message);
                    }
                }
                return;
            }
            if (mode == "BATCH")
            {
                System.Console.WriteLine(mode);
                List<WriteRequest> writeRequests = new List<WriteRequest>();
                foreach (var msg in evnt.Records)
                {
                    var rec = JsonSerializer.Deserialize<DataRecord>(msg.Body);
                    System.Console.WriteLine(rec.Data.ToString());

                    PutRequest putRequest = new PutRequest
                    {
                        Item = new Dictionary<string, AttributeValue>
                        {
                            { "pk", new AttributeValue { S = rec.PK } },
                            { "sk", new AttributeValue { S = rec.SK } },
                            { "data1", new AttributeValue { S = rec.Data } },
                            { "list", new AttributeValue { L = new List<AttributeValue>
                                {   new AttributeValue { S = rec.Data },
                                    new AttributeValue { S = rec.Data } }
                                }
                            }
                        },
                    };
                    var writeRequest = new WriteRequest(putRequest);
                    writeRequests.Add(writeRequest);
                }
                BatchWriteItemRequest batchWrite = new BatchWriteItemRequest()
                {
                    ReturnConsumedCapacity = "TOTAL",
                    RequestItems = new Dictionary<string, List<WriteRequest>> {
                        {
                            table, writeRequests
                        }
                    }
                };

                try
                {
                    await client.BatchWriteItemAsync(batchWrite);
                    context.Logger.LogLine("OK");
                }
                catch (Exception ex)
                {
                    System.Console.WriteLine(ex.Message);
                }

                return;
            }
        }
    }
    public class DataRecord
    {
        public string PK { get; set; }
        public string SK { get; set; }
        public string Data { get; set; }
    }
}
