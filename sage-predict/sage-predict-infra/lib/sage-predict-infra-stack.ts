import * as cdk from '@aws-cdk/core';
import { Queue } from '@aws-cdk/aws-sqs';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecr from '@aws-cdk/aws-ecr';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs'
import { Runtime } from '@aws-cdk/aws-lambda'

export class SagePredictInfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const queue = new Queue(this, 'queue');

    new cdk.CfnOutput(this, 'output-queue', {
      value: queue.queueUrl
    });

    const vpc = new ec2.Vpc(this, 'ss-vpc', {
        cidr: '10.0.0.0/16',
        maxAzs: 2,
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'publicSubnet',
            subnetType: ec2.SubnetType.PUBLIC,
          }
        ],
        natGateways: 0
      });

      const cluster = new ecs.Cluster(this, 'Cluster', {
        vpc: vpc
      });

      const repo = new ecr.Repository(this, 'repo');

      const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
        memoryLimitMiB: 512,
        cpu: 256,
      });
      

      taskDefinition.addContainer('scikit', {
        image: ecs.ContainerImage.fromEcrRepository(repo),
        environment: { // clear text, not for sensitive data
          AWS_SQS_QUEUE_URL: queue.queueUrl,
        },
        logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'scikitDemo' })
      });

      queue.grantConsumeMessages(taskDefinition.taskRole)
      repo.grantPull(taskDefinition.taskRole)

      const service = new ecs.FargateService(this, 'Service', {
        cluster,
        taskDefinition,
        desiredCount: 1,
        assignPublicIp: true
      });
      
      const scaling = service.autoScaleTaskCount({ maxCapacity: 10 });
        scaling.scaleOnCpuUtilization('CpuScaling', {
          targetUtilizationPercent: 50
        });


    // const fn_Predict = new NodejsFunction(this, 'fn_Predict', {
    //   entry: '../functions/WrapLambda/index.ts',
    //   handler: 'index.handler',
    //   runtime: Runtime.NODEJS_12_X,
    //   memorySize: 512,
    //   timeout: cdk.Duration.seconds(10),
    //   environment:
    //   {
    //     AWS_SAGEMAKER_ENDPOINT: "xgboost-2020-07-07-07-32-11-117"
    //   }
    // })

  }
}
