import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
import * as s3 from '@aws-cdk/aws-s3';
import {
  EventBus,
  Rule,
  EventField,
  IRuleTarget,
  RuleTargetInput,
} from '@aws-cdk/aws-events';
import { Runtime, Function, Code } from '@aws-cdk/aws-lambda';
import lambda = require('@aws-cdk/aws-lambda-nodejs');
import { LambdaFunction, SqsQueue } from '@aws-cdk/aws-events-targets';
import * as sqs from '@aws-cdk/aws-sqs';
import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';

export class EbTransformStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //Create a new VPC for this project
    const vpc = new ec2.Vpc(this, 'vpc');

    //Create source database for data
    const dbName = 'events';
    const dbUserName = 'syscdk';
    const database = new rds.DatabaseInstance(this, 'Instance', {
      engine: rds.DatabaseInstanceEngine.MYSQL,
      instanceClass: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.SMALL
      ),
      masterUsername: dbUserName,
      iamAuthentication: true,
      vpc,
      vpcPlacement: { subnetType: ec2.SubnetType.PRIVATE },
      deletionProtection: false,
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    //Create target bucket
    const bucket = new s3.Bucket(this, 'bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    //Create EventBridge
    const eventBus = new EventBus(this, 'eventBus');

    const role_fnGetData = new iam.Role(this, 'role_fnGetData', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    role_fnGetData.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole'
      )
    );

    role_fnGetData.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaVPCAccessExecutionRole'
      )
    );

    role_fnGetData.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [eventBus.eventBusArn],
        actions: ['events:PutEvents'],
      })
    );

    const fnGetData = new lambda.NodejsFunction(this, 'fnGetData', {
      entry: './functions/fnGetData/index.ts',
      handler: 'handler',
      runtime: Runtime.NODEJS_12_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(60),
      role: role_fnGetData,
      environment: {
        DB_HOST: database.dbInstanceEndpointAddress,
        DB_NAME: dbName,
        DB_USERNAME: dbUserName,
        DB_PASSWORD:
          database.secret?.secretValueFromJson('password').toString() ||
          'error getting user secret',
        AWS_EVENTBUS_NAME: eventBus.eventBusName,
        AWS_EVENTBUS_SOURCE: 'BUILD_STATUS',
      },
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE },
    });
    database.connections.addSecurityGroup(
      fnGetData.connections.securityGroups[0]
    );

    //Create a queue for the events
    const queue = new sqs.Queue(this, 'queue');

    //Create rule for new SMS Message Received
    const processEvents = new Rule(this, 'processEvents', {
      eventBus: eventBus,
      eventPattern: {
        source: ['BUILD_STATUS'],
      },
    });
    const logger = new Function(this, 's3-event-test-lambda', {
      code: Code.fromInline(
        'exports.handler = async function(event) { console.log(JSON.stringify(event)); }'
      ),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_12_X,
    });

    processEvents.addTarget(
      new AddTargetWithInput(
        'T1',
        queue.queueArn,
        RuleTargetInput.fromObject({
          id: EventField.fromPath('$.id'),
          deployment_time: EventField.fromPath('$.detail.deployment_time'),
          version: EventField.fromPath('$.detail.version'),
        })
      )
    );

    const eventToSqsPolicyStatement = new iam.PolicyStatement({
      resources: [queue.queueArn],
      effect: iam.Effect.ALLOW,
      principals: [
        new iam.ServicePrincipal('events.amazonaws.com').withConditions({
          ArnEquals: {
            'aws:SourceArn': processEvents.ruleArn,
          },
        }),
      ],
      actions: ['sqs:GetQueueAttributes', 'sqs:GetQueueUrl', 'sqs:SendMessage'],
    });

    const eventToSqsPolicy = new sqs.QueuePolicy(this, 'eventToSqsPolicy', {
      queues: [queue],
    });

    eventToSqsPolicy.document.addStatements(eventToSqsPolicyStatement);

    const role_fnWriteData = new iam.Role(this, 'role_fnWriteData', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    role_fnWriteData.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole'
      )
    );

    const fnWriteData = new lambda.NodejsFunction(this, 'fnWriteData', {
      entry: './functions/fnWriteData/index.ts',
      handler: 'handler',
      runtime: Runtime.NODEJS_12_X,
      timeout: cdk.Duration.seconds(10),
      role: role_fnWriteData,
      environment: {
        AWS_S3_BUCKET: bucket.bucketName,
      },
    });
    bucket.grantPut(role_fnWriteData);
    fnWriteData.addEventSource(new SqsEventSource(queue));
  }
}

export class AddTargetWithInput implements IRuleTarget {
  public constructor(
    private readonly id: string,
    private readonly arn: string,
    private readonly input?: RuleTargetInput
  ) {}

  public bind() {
    return { id: this.id, arn: this.arn, input: this.input };
  }
}
