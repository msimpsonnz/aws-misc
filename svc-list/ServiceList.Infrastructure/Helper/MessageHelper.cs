using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Amazon.SQS;
using Amazon.SQS.Model;
using ServiceList.Core;
using Newtonsoft.Json;

namespace ServiceList.Infrastructure
{
    public class MessageHelper
    {
        private static AmazonSQSClient sqsClient = new AmazonSQSClient();
        public static async Task<string> SendNotification(List<Service> onlineServiceList, List<Service> masterServiceList, string queueUrl)
        {
            List<SendMessageRequest> messageList = GenerateNotification(onlineServiceList, masterServiceList, queueUrl);
            List<string> messageId = new List<string>();
            foreach (var msg in messageList)
            {
                var response = await sqsClient.SendMessageAsync(msg);
                messageId.Add(response.MessageId);
            }
            return messageId.ToString();

        }

        public static List<SendMessageRequest> GenerateNotification(List<Service> onlineServiceList, List<Service> masterServiceList, string queueUrl)
        {
            List<Service> orderedOnlineServiceList = ServiceListHelper.OrderServiceListById(onlineServiceList);
            List<Service> orderedMasterServiceList = ServiceListHelper.OrderServiceListById(masterServiceList);
            List<string> masterListId = orderedMasterServiceList.Select(x => x.id).ToList();
            List<string> onlineListId = orderedOnlineServiceList.Select(x => x.id).ToList();
            List<string> updateList = onlineListId.Except(masterListId).ToList();
            List<string> removeList = masterListId.Except(onlineListId).ToList();

            List<SendMessageRequest> messageList = new List<SendMessageRequest>();
            if (updateList.Count == 0 && removeList.Count == 0)
            {
                var request = BuildMessage("no-update", "no-update", queueUrl);
                messageList.Add(request);
            }
            else
            {
                if (updateList.Count > 0)
                {
                    foreach (var svc in updateList)
                    {
                        var messageBody = JsonConvert.SerializeObject(orderedOnlineServiceList.Where(x => x.id == svc).FirstOrDefault());
                        var request = BuildMessage("service-added", messageBody, queueUrl);
                        messageList.Add(request);
                    }
                }

                if (removeList.Count > 0)
                {
                    foreach (var svc in removeList)
                    {
                        var messageBody = JsonConvert.SerializeObject(orderedMasterServiceList.Where(x => x.id == svc).FirstOrDefault());
                        var request = BuildMessage("service-changed", messageBody, queueUrl);
                        messageList.Add(request);
                    }
                }

            }
            return messageList;
        }

        private static SendMessageRequest BuildMessage(string notificationType, string messageBody, string queueUrl)
        {
            var request = new SendMessageRequest()
            {
                MessageAttributes = new Dictionary<string, MessageAttributeValue>
                {
                    {
                        "NotificationType", new MessageAttributeValue
                        {
                            DataType = "String", StringValue = notificationType
                        }
                    }
                },
                MessageBody = messageBody,
                QueueUrl = queueUrl
            };

            return request;

        }

    }
}