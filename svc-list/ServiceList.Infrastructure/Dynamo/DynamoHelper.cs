using System;
using System.IO;
using System.Collections.Generic;
using System.Threading.Tasks;
using Amazon;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Amazon.DynamoDBv2.DocumentModel;
using ServiceList.Core;
using System.Linq;

namespace ServiceList.Infrastructure
{
    public class DynamoHelper
    {
        public static AmazonDynamoDBClient client = new AmazonDynamoDBClient(RegionEndpoint.APSoutheast2);

        public static async Task GetBatchRequest(string tableName)
        {
            var request = new QueryRequest
            {
                TableName = "service-list",
                IndexName = "service-list-gsi",
                KeyConditionExpression = "ItemType = :v_ItemType",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue> {
                    {":v_ItemType", new AttributeValue { S =  "product#master" }}}
            };

            try
            {
                var response = await client.QueryAsync(request);

                foreach (Dictionary<string, AttributeValue> item in response.Items)
                {
                    // Process the result.
                    Console.WriteLine(item.Values.ToString());
                }
            }
            catch (System.Exception ex)
            {
                Console.WriteLine(ex.Message);
                throw;
            }
        }

        public static async Task QueryTable()
        {
            QueryFilter filter = new QueryFilter("ItemType", QueryOperator.Equal, "product#master");
            //filter.AddCondition("ReplyDateTime", QueryOperator.Between, startDate, endDate);

            QueryOperationConfig config = new QueryOperationConfig()
            {
                IndexName = "service-list-gsi",
                Select = SelectValues.SpecificAttributes,
                AttributesToGet = new List<string> { "id",
                                  "Name",
                                  "ShortName",
                                  "Description",
                                  "Link" },
                //ConsistentRead = true,
                Filter = filter
            };
            Table table = Table.LoadTable(client, "service-list");
            Search search = table.Query(config);

            List<Document> documentList = new List<Document>();
            try
            {
                do
                {
                    documentList = await search.GetNextSetAsync();
                    foreach (var document in documentList)
                    {
                        PrintDocument(document);
                    }
                } while (!search.IsDone);
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine(ex.Message);
                throw;
            }

        }
        private static void PrintDocument(Document document)
        {
            //   count++;
            Console.WriteLine();
            foreach (var attribute in document.GetAttributeNames())
            {
                string stringValue = null;
                var value = document[attribute];
                if (value is Primitive)
                    stringValue = value.AsPrimitive().Value.ToString();
                else if (value is PrimitiveList)
                    stringValue = string.Join(",", (from primitive
                                    in value.AsPrimitiveList().Entries
                                                    select primitive.Value).ToArray());
                Console.WriteLine("{0} - {1}", attribute, stringValue);
            }
        }



        public static async Task UpdateTable(List<Service> serviceList)
        {

            var table = Table.LoadTable(client, "service-list");

            foreach (Service svc in serviceList)
            {
                var item = new Document();

                item["id"] = svc.id;
                item["ItemType"] = "product#master";
                item["Name"] = svc.Name;
                item["ShortName"] = svc.ShortName;
                item["Description"] = svc.Description;
                item["Link"] = svc.Link;

                await table.PutItemAsync(item);
            }


        }
    }
}