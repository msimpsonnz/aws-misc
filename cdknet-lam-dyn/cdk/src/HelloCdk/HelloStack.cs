using Amazon.CDK;
using Amazon.CDK.AWS.Lambda;

namespace HelloCdk
{
    public class HelloStack : Stack
    {
        public HelloStack(Construct parent, string id, IStackProps props) : base(parent, id, props)
        {
            var lambda = new Function(this, "mjsdeme-cdk-blog-api", new FunctionProps {
               Runtime = Function.Runtime.DotNetCore21,
               Handler = ""
            });
        }
    }

}
