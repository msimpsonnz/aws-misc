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
    }
}
