import cdk = require('@aws-cdk/cdk');
import sqs = require('@aws-cdk/aws-sqs');
import batch = require('@aws-cdk/aws-batch');
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import { ServicePrincipal } from '@aws-cdk/aws-iam';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const batchServiceRole = new iam.Role(this, 'batchServiceRole', {
      roleName: 'batchServiceRole',
      assumedBy: new ServicePrincipal('batch.amazonaws.com'),
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AWSBatchServiceRole'
      ]
    });

    const spotFleetRole = new iam.Role(this, 'spotFleetRole', {
      roleName: 'AmazonEC2SpotFleetRole',
      assumedBy: new ServicePrincipal('spotfleet.amazonaws.com'),
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AmazonEC2SpotFleetTaggingRole'
      ]
    });

    const batchInstanceRole = new iam.Role(this, 'batchInstanceRole', {
      roleName: 'batchInstanceRole',
      assumedBy: new iam.CompositePrincipal( 
          new ServicePrincipal('ec2.amazonaws.com'),
          new ServicePrincipal('ecs.amazonaws.com')),
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/AmazonS3FullAccess'
      ]
    });

    const sqsQueue = new sqs.Queue(this, 'batchQueue');
    sqsQueue.grantConsumeMessages(batchInstanceRole);

    const vpc = new ec2.Vpc(this, 'batchVPC', {
      cidr: '10.99.0.0/16'
    });

    const compEnv = new batch.CfnComputeEnvironment(this, 'batchCompute', {
      type: 'MANAGED',
      serviceRole: batchServiceRole.roleArn,
      computeResources: {
        type: 'SPOT',
        maxvCpus: 128,
        minvCpus: 0,
        desiredvCpus: 0,
        spotIamFleetRole: spotFleetRole.roleArn,
        instanceRole: batchInstanceRole.roleName,
        instanceTypes: [
          'optimal'
        ],
        subnets: [
          vpc.publicSubnets[0].subnetId,
          vpc.publicSubnets[1].subnetId,
          vpc.publicSubnets[2].subnetId
        ],
        securityGroupIds: [
          vpc.vpcDefaultSecurityGroup
        ]
      }
    });

    new batch.CfnJobDefinition(this, 'batchJobDef', {
      jobDefinitionName: "s3select-dotnet",
      type: "container",
      containerProperties: {
        image: this.accountId + ".dkr.ecr.us-east-1.amazonaws.com/mjsdemo-ecr:latest",
        vcpus: 1,
        memory: 128,
        environment: [
          {
            name: "SQS_QUEUE_URL",
            value: sqsQueue.queueUrl
          },
          {
            name: "S3_QUERY_LIMIT",
            value: " LIMIT 10000"
          } 
        ]
      }
    });

    new batch.CfnJobQueue(this, 'batchJobQueue', {
      jobQueueName: 'batchJobSpot',
      computeEnvironmentOrder: [
        {
          computeEnvironment: compEnv.ref,
          order: 1
        }
      ],
      priority: 1     
    });

  }
}
