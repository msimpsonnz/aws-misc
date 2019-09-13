

```bash
#!bin/bash
git clone https://github.com/msimpsonnz/aws-misc.git
cd aws-misc/dms-stream

aws iam create-role --role-name dms-vpc-role --assume-role-policy-document file://dmsAssumeRolePolicyDocument.json

aws iam attach-role-policy --role-name dms-vpc-role --policy-arn arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole

cd cdk
cdk deploy
```

