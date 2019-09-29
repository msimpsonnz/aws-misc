using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using System.Linq;
using Newtonsoft.Json;
using Xunit;

using ServiceList.Core;
using ServiceList.Infrastructure;


namespace ServiceList.Tests
{
    public class MessageTests
    {
        [Fact]
        public void ServiceAddedSuccess()
        {
            //Arrange
            const string result = "dynamodb";
            var rawMasterSerivce = File.ReadAllText("TestData/master-svc-171.json");
            List<Service> masterServiceList = JsonConvert.DeserializeObject<List<Service>>(rawMasterSerivce);
            var rawOnlineSerivce = File.ReadAllText("TestData/master-svc-172.json");
            List<Service> onlineServiceList = JsonConvert.DeserializeObject<List<Service>>(rawOnlineSerivce);

            //Act
            var msgList = MessageHelper.GenerateNotification(onlineServiceList, masterServiceList, "");
            var service = JsonConvert.DeserializeObject<Service>(msgList.FirstOrDefault().MessageBody);

            //Assert
            Assert.Equal(result, service.ShortName);
            
            
        }

        [Fact]
        public void ServiceChangedFromMaster()
        {
            //Arrange
            const string result = "dynamodb";
            var rawMasterSerivce = File.ReadAllText("TestData/master-svc-172.json");
            List<Service> masterServiceList = JsonConvert.DeserializeObject<List<Service>>(rawMasterSerivce);
            var rawOnlineSerivce = File.ReadAllText("TestData/master-svc-171.json");
            List<Service> onlineServiceList = JsonConvert.DeserializeObject<List<Service>>(rawOnlineSerivce);

            //Act
            var msgList = MessageHelper.GenerateNotification(onlineServiceList, masterServiceList, "");
            var service = JsonConvert.DeserializeObject<Service>(msgList.FirstOrDefault().MessageBody);

            //Assert
            Assert.Equal(result, service.ShortName);
            
            
        }


        [Fact]
        public void CompareSameListSuccess()
        {
            //Arrange
            const string result = "no-update";
            var rawMasterSerivce = File.ReadAllText("TestData/master-svc-172.json");
            List<Service> masterServiceList = JsonConvert.DeserializeObject<List<Service>>(rawMasterSerivce);
            var rawOnlineSerivce = File.ReadAllText("TestData/master-svc-172.json");
            List<Service> onlineServiceList = JsonConvert.DeserializeObject<List<Service>>(rawOnlineSerivce);

            //Act
            var msgList = MessageHelper.GenerateNotification(onlineServiceList, masterServiceList, "");


            //Assert
            Assert.Equal(result, msgList[0].MessageAttributes.FirstOrDefault().Value.StringValue);
            
        }

        [Fact]
        public async Task TestUpdateDynamo()
        {
            var rawUpdate = File.ReadAllText("TestData/update-test.json");
            await DynamoHelper.UpdateTable(rawUpdate);


        }

        [Fact]
        public async Task IntegrationTest()
        {
            List<Service> onlineServiceList = await HtmlHelper.ParseAwsServices("https://aws.amazon.com/products/");
            System.Console.WriteLine($"Query online list: {onlineServiceList.Count()}");
            List<Service> masterServiceList = await DynamoHelper.QueryTable();
            List<Service> orderedOnlineServiceList = ServiceListHelper.OrderServiceListById(onlineServiceList);
            List<Service> orderedMasterServiceList = ServiceListHelper.OrderServiceListById(masterServiceList);
            List<string> masterListId = orderedMasterServiceList.Select(x => x.id).ToList();
            List<string> onlineListId = orderedOnlineServiceList.Select(x => x.id).ToList();
            List<string> updateList = onlineListId.Except(masterListId).ToList();
            List<string> removeList = masterListId.Except(onlineListId).ToList();
            System.Console.WriteLine();
        }
        
    }
}
