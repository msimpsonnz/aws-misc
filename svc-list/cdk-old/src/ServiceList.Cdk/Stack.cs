using Amazon.CDK;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Lambda;

namespace ServiceList.Cdk
{
    public class ServiceListStackBase : Stack
    {
        public ServiceListStackBase(Construct parent, string id, IStackProps props) : base(parent, id, props)
        {
            var lambda = new Function(this, "mjsdemo-cdk-blog-api", new FunctionProps
            {
                Runtime = Runtime.DotNetCore21,
                Handler = ""
            });

        }
    }
}
