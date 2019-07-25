### This is a cut down guide from [EKS Workshop](https://eksworkshop.com) to make it possible to run multiple clusters in a single AWS Account

1. Complete the steps to build:
* Cloud9 Environment
* Create IAM Role and attach to instance

2. You should be at the [Create SSH Key](https://eksworkshop.com/prerequisites/k8stools/) page

```bash
sudo curl --silent --location -o /usr/local/bin/kubectl https://storage.googleapis.com/kubernetes-release/release/v1.13.7/bin/linux/amd64/kubectl


sudo chmod +x /usr/local/bin/kubectl

sudo yum -y install jq gettext

for command in kubectl jq envsubst
  do
    which $command &>/dev/null && echo "$command in path" || echo "$command NOT FOUND"
  done

```

```bash
cd ~/environment
git clone https://github.com/brentley/ecsdemo-frontend.git
git clone https://github.com/brentley/ecsdemo-nodejs.git
git clone https://github.com/brentley/ecsdemo-crystal.git
```

```bash
rm -vf ${HOME}/.aws/credentials

export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')

echo "export ACCOUNT_ID=${ACCOUNT_ID}" >> ~/.bash_profile
echo "export AWS_REGION=${AWS_REGION}" >> ~/.bash_profile
aws configure set default.region ${AWS_REGION}
aws configure get default.region
```

```bash
read -p "Enter Your Initials: "  INITIALS
read -p "Enter Your Date of Birth: "  DOB
export EKS_CLUSTER=${INITIALS}-${DOB}
echo "export EKS_CLUSTER=${INITIALS}-${DOB}" >> ~/.bash_profile
echo $EKS_CLUSTER
```

```bash
curl --silent --location "https://github.com/weaveworks/eksctl/releases/download/latest_release/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp

sudo mv -v /tmp/eksctl /usr/local/bin

eksctl version
```

```bash
eksctl create cluster --version=1.13 --name=eksworkshop-$EKS_CLUSTER --nodes=2 --node-ami=auto --node-type m5.large --region=${AWS_REGION}
```

```bash
aws eks update-kubeconfig --name "eksworkshop-$EKS_CLUSTER"

kubectl get nodes
```

```
STACK_NAME=$(eksctl get nodegroup --cluster eksworkshop-$EKS_CLUSTER -o json | jq -r '.[].StackName')
INSTANCE_PROFILE_ARN=$(aws cloudformation describe-stacks --stack-name $STACK_NAME | jq -r '.Stacks[].Outputs[] | select(.OutputKey=="InstanceProfileARN") | .OutputValue')
ROLE_NAME=$(aws cloudformation describe-stacks --stack-name $STACK_NAME | jq -r '.Stacks[].Outputs[] | select(.OutputKey=="InstanceRoleARN") | .OutputValue' | cut -f2 -d/)
echo "export ROLE_NAME=${ROLE_NAME}" >> ~/.bash_profile
echo "export INSTANCE_PROFILE_ARN=${INSTANCE_PROFILE_ARN}" >> ~/.bash_profile
```

```bash
cd ~/environment

curl https://raw.githubusercontent.com/kubernetes/helm/master/scripts/get > get_helm.sh

chmod +x get_helm.sh

./get_helm.sh
```

```bash
cat <<EoF > ~/environment/rbac.yaml
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: tiller
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRoleBinding
metadata:
  name: tiller
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: ServiceAccount
    name: tiller
    namespace: kube-system
EoF
```

```bash
kubectl apply -f ~/environment/rbac.yaml

helm init --service-account tiller
```


```bash
STACK_NAME=$(aws cloudformation describe-stacks | jq -r '.Stacks[].StackName' | grep eksctl-eksworkshop-$EKS_CLUSTER-nodegroup)
SG_ID=$(aws cloudformation describe-stack-resources --stack-name $STACK_NAME --logical-resource-id SG | jq -r '.StackResources[].PhysicalResourceId')
echo $SG_ID
```