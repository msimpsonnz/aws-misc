## How to run

IMPORTANT! You must use 'us-east-1' region for this demo as CloudFront only supports ACM certs from that region.

1. Create a EC2 Key Pair in 'us-east-1', update './lib/cf-fwd-stack.ts'
2. Create a Route53 public hosted zone and update './lib/cf-fwd-stack.ts'
3. Install Node, NPM and NPX

npm i
npx cdk deploy

