import { 
  Duration,
  Stack, 
  StackProps,
  aws_iam as iam,
  aws_dynamodb as dynamodb,
  aws_lambda as lambda,
  aws_lambda_nodejs as lambda_nodejs,
  aws_lambda_event_sources as lambda_event_sources,
  aws_stepfunctions as stepfunctions,
  aws_stepfunctions_tasks as sfntasks
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class SfnDemoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'table', {
      partitionKey: {
        name: 'pk',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_IMAGE 
    });

    const fn_postExternal = new lambda_nodejs.NodejsFunction(this, 'fn_postExternal', {
      entry: './functions/postExternal/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      timeout: Duration.seconds(10),
      environment: {
      }
    });

    const sfnTask_callFirstService = new sfntasks.LambdaInvoke(
      this,
      'sfnTask_callFirstService',
      {
        lambdaFunction: fn_postExternal,
        payload: stepfunctions.TaskInput.fromJsonPathAt('$'),
      }
    );

    const sfnTask_callSecondService = new sfntasks.LambdaInvoke(
      this,
      'sfnTask_callSecondService',
      {
        lambdaFunction: fn_postExternal,
        payload: stepfunctions.TaskInput.fromJsonPathAt('$'),
      }
    );

    const sfnTask_callThirdService = new sfntasks.LambdaInvoke(
      this,
      'sfnTask_callThirdService',
      {
        lambdaFunction: fn_postExternal,
        payload: stepfunctions.TaskInput.fromJsonPathAt('$'),
      }
    );

    const parallel = new stepfunctions.Parallel(this, 'parallel');

    parallel.branch(sfnTask_callSecondService);
    parallel.branch(sfnTask_callThirdService);

    const definition = stepfunctions.Chain.start(sfnTask_callFirstService)
      .next(parallel)

    const stateMachine = new stepfunctions.StateMachine(this, 'stateMachine', {
      definition,
      timeout: Duration.minutes(5),
    });

    const role_fn_sfnStartExec = new iam.Role(
      this,
      'role_fn_sfnStartExec',
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      }
    );

    role_fn_sfnStartExec.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole'
      )
    );

    role_fn_sfnStartExec.addToPolicy(
      new iam.PolicyStatement({
        resources: [
          stateMachine.stateMachineArn
        ],
        actions: [
          'states:*'
        ],
      })
    );

    const fn_sfnStartExec = new lambda_nodejs.NodejsFunction(this, 'fn_sfnStartExec', {
      entry: './functions/sfnStartExec/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      role: role_fn_sfnStartExec,
      timeout: Duration.seconds(10),
      environment: {
        AWS_SFN_ARN: stateMachine.stateMachineArn
      }
    });

    fn_sfnStartExec.addEventSource(new lambda_event_sources.DynamoEventSource(table, {
      startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 5
    }));

  }
}
