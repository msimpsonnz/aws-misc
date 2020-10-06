import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as dynamo from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as lambdanode from '@aws-cdk/aws-lambda-nodejs';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as synthetics from '@aws-cdk/aws-synthetics';
import * as logs from '@aws-cdk/aws-logs';
import * as events from '@aws-cdk/aws-events';
import * as targets from '@aws-cdk/aws-events-targets';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';
import { GraphWidget, IMetric, Metric } from '@aws-cdk/aws-cloudwatch';

export class XrayDemoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamo.Table(this, 'table', {
      partitionKey: {
        name: 'pk',
        type: dynamo.AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: dynamo.AttributeType.STRING,
      },
      billingMode: dynamo.BillingMode.PROVISIONED,
      readCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const fnDynamo = new lambdanode.NodejsFunction(this, 'fnDynamo', {
      entry: './func/recordhandler/index.js',
      handler: 'handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      environment: {
        AWS_DYNAMODB_TABLE: table.tableName,
        FAIL: false.toString(),
      },
      tracing: lambda.Tracing.ACTIVE,
      currentVersionOptions: {
        removalPolicy: cdk.RemovalPolicy.DESTROY, // retain old versions
        retryAttempts: 1                     // async retry attempts
      }
    });
    fnDynamo.currentVersion.addAlias('live');
    table.grantReadWriteData(fnDynamo);

    const api = new apigateway.LambdaRestApi(this, 'obs-demo', {
      handler: fnDynamo,
      deployOptions: {
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        metricsEnabled: true,
        tracingEnabled: true,
      },
    });

    new logs.LogRetention(this, 'apiLogGroup', {
      logGroupName: `API-Gateway-Execution-Logs_${api.restApiId}/${api.deploymentStage.stageName}`,
      retention: logs.RetentionDays.THREE_MONTHS,
    });

    const canaryGET = new synthetics.Canary(this, 'canaryGET', {
      runtime: synthetics.Runtime.SYNTHETICS_1_0,
      schedule: synthetics.Schedule.rate(cdk.Duration.minutes(8)),
      test: synthetics.Test.custom({
        code: lambda.Code.fromAsset('./func/canary'),
        handler: 'index.handler',
      }),
    });

    const canaryPOST = new synthetics.Canary(this, 'canaryPOST', {
      runtime: synthetics.Runtime.SYNTHETICS_1_0,
      schedule: synthetics.Schedule.rate(cdk.Duration.minutes(60)),
      test: synthetics.Test.custom({
        code: lambda.Code.fromAsset('./func/canary1'),
        handler: 'index.handler',
      }),
    });

    const role_fnPutCustomMetric = new iam.Role(
      this,
      'role_fnTenantProvision',
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      }
    );

    role_fnPutCustomMetric.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole'
      )
    );

    role_fnPutCustomMetric.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ['*'],
        actions: [
          'cloudwatch:PutMetricData',
        ],
      })
    );


    const fnPutCustomMetric = new lambda.Function(this, 'fnPutCustomMetric', {
      code: lambda.Code.fromAsset('./func/custommetric'),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      role: role_fnPutCustomMetric
    })

    const ruleSfnEvents = new events.Rule(this, 'ruleSfnEvents', {
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Pipeline Execution State Change'],
        detail: {
          state: ['SUCCEEDED']
        },
      }
    });

    ruleSfnEvents.addTarget(
      new targets.LambdaFunction(fnPutCustomMetric)
    );

    // From https://github.com/cdk-patterns/serverless/blob/master/the-cloudwatch-dashboard/typescript/lib/the-cloudwatch-dashboard-stack.ts

    let apiGateway4xxErrorPercentage = new cloudwatch.MathExpression({
      expression: 'm1/m2*100',
      label: '% API Gateway 4xx Errors',
      usingMetrics: {
        m1: this.metricForApiGw(api.restApiId, '4XXError', '4XX Errors', 'sum'),
        m2: this.metricForApiGw(api.restApiId, 'Count', '# Requests', 'sum'),
      },
      period: cdk.Duration.minutes(5),
    });

    // Gather the % of lambda invocations that error in past 5 mins
    let dynamoLambdaErrorPercentage = new cloudwatch.MathExpression({
      expression: 'e / i * 100',
      label: '% of invocations that errored, last 5 mins',
      usingMetrics: {
        i: table.metric('Invocations', { statistic: 'sum' }),
        e: table.metric('Errors', { statistic: 'sum' }),
      },
      period: cdk.Duration.minutes(5),
    });

    // note: throttled requests are not counted in total num of invocations
    let dynamoLambdaThrottledPercentage = new cloudwatch.MathExpression({
      expression: 't / (i + t) * 100',
      label: '% of throttled requests, last 30 mins',
      usingMetrics: {
        i: table.metric('Invocations', { statistic: 'sum' }),
        t: table.metric('Throttles', { statistic: 'sum' }),
      },
      period: cdk.Duration.minutes(5),
    });

    let dynamoDBThrottles = new cloudwatch.MathExpression({
      expression: 'm1 + m2',
      label: 'DynamoDB Throttles',
      usingMetrics: {
        m1: table.metric('ReadThrottleEvents', { statistic: 'sum' }),
        m2: table.metric('WriteThrottleEvents', { statistic: 'sum' }),
      },
      period: cdk.Duration.minutes(5),
    });

    /**
     * Alarms
     */

    // API Gateway

    // 4xx are user errors so a large volume indicates a problem
    new cloudwatch.Alarm(this, 'API Gateway 4XX Errors > 1%', {
      metric: apiGateway4xxErrorPercentage,
      threshold: 1,
      evaluationPeriods: 6,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // 5xx are internal server errors so we want 0 of these
    new cloudwatch.Alarm(this, 'API Gateway 5XX Errors > 0', {
      metric: this.metricForApiGw(
        api.restApiId,
        '5XXError',
        '5XX Errors',
        'p99'
      ),
      threshold: 0,
      period: cdk.Duration.minutes(5),
      evaluationPeriods: 6,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'API p99 latency alarm >= 1s', {
      metric: this.metricForApiGw(
        api.restApiId,
        'Latency',
        'API GW Latency',
        'p99'
      ),
      threshold: 1000,
      period: cdk.Duration.minutes(5),
      evaluationPeriods: 6,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Lambda

    // 2% of Dynamo Lambda invocations erroring
    new cloudwatch.Alarm(this, 'Dynamo Lambda 2% Error', {
      metric: dynamoLambdaErrorPercentage,
      threshold: 2,
      evaluationPeriods: 6,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // 1% of Lambda invocations taking longer than 1 second
    new cloudwatch.Alarm(this, 'Dynamo Lambda p99 Long Duration (>1s)', {
      metric: fnDynamo.metricDuration(),
      period: cdk.Duration.minutes(5),
      threshold: 1000,
      evaluationPeriods: 6,
      datapointsToAlarm: 1,
      statistic: 'p99',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // 2% of our lambda invocations are throttled
    new cloudwatch.Alarm(this, 'Dynamo Lambda 2% Throttled', {
      metric: dynamoLambdaThrottledPercentage,
      threshold: 2,
      evaluationPeriods: 6,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // DynamoDB

    // DynamoDB Interactions are throttled - indicated poorly provisioned
    new cloudwatch.Alarm(this, 'DynamoDB Table Reads/Writes Throttled', {
      metric: dynamoDBThrottles,
      threshold: 1,
      evaluationPeriods: 6,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // // There should be 0 DynamoDB errors
    // new cloudwatch.Alarm(this, 'DynamoDB Errors > 0', {
    //   metric: dynamoDBTotalErrors,
    //   threshold: 0,
    //   evaluationPeriods: 6,
    //   datapointsToAlarm: 1,
    //   treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    // }).addAlarmAction(new SnsAction(errorTopic));

    /**
     * Custom Cloudwatch Dashboard
     */

    new cloudwatch.Dashboard(this, 'CloudWatchDashBoard').addWidgets(
      this.buildGraphWidget('Requests', [
        this.metricForApiGw(api.restApiId, 'Count', '# Requests', 'sum'),
      ]),
      this.buildGraphWidget(
        'API GW Latency',
        [
          this.metricForApiGw(
            api.restApiId,
            'Latency',
            'API Latency p50',
            'p50'
          ),
          this.metricForApiGw(
            api.restApiId,
            'Latency',
            'API Latency p90',
            'p90'
          ),
          this.metricForApiGw(
            api.restApiId,
            'Latency',
            'API Latency p99',
            'p99'
          ),
        ],
        true
      ),
      this.buildGraphWidget(
        'API GW Errors',
        [
          this.metricForApiGw(api.restApiId, '4XXError', '4XX Errors', 'sum'),
          this.metricForApiGw(api.restApiId, '5XXError', '5XX Errors', 'sum'),
        ],
        true
      ),
      this.buildGraphWidget('Dynamo Lambda Error %', [
        dynamoLambdaErrorPercentage,
      ]),
      this.buildGraphWidget(
        'Dynamo Lambda Duration',
        [
          fnDynamo.metricDuration({ statistic: 'p50' }),
          fnDynamo.metricDuration({ statistic: 'p90' }),
          fnDynamo.metricDuration({ statistic: 'p99' }),
        ],
        true
      ),
      this.buildGraphWidget('Dynamo Lambda Throttle %', [
        dynamoLambdaThrottledPercentage,
      ]),
      this.buildGraphWidget(
        'DynamoDB Latency',
        [
          table.metricSuccessfulRequestLatency({
            dimensions: { TableName: table.tableName, Operation: 'GetItem' },
          }),
          table.metricSuccessfulRequestLatency({
            dimensions: { TableName: table.tableName, Operation: 'UpdateItem' },
          }),
          table.metricSuccessfulRequestLatency({
            dimensions: { TableName: table.tableName, Operation: 'PutItem' },
          }),
          table.metricSuccessfulRequestLatency({
            dimensions: { TableName: table.tableName, Operation: 'DeleteItem' },
          }),
          table.metricSuccessfulRequestLatency({
            dimensions: { TableName: table.tableName, Operation: 'Query' },
          }),
        ],
        true
      ),
      this.buildGraphWidget(
        'DynamoDB Consumed Read/Write Units',
        [
          table.metric('ConsumedReadCapacityUnits'),
          table.metric('ConsumedWriteCapacityUnits'),
        ],
        false
      ),
      this.buildGraphWidget(
        'DynamoDB Throttles',
        [
          table.metric('ReadThrottleEvents', { statistic: 'sum' }),
          table.metric('WriteThrottleEvents', { statistic: 'sum' }),
        ],
        true
      )
    );

    new cdk.CfnOutput(this, 'HTTP API Url', {
      value: api.url ?? 'Something went wrong with the deploy',
    });
  }

  private buildGraphWidget(
    widgetName: string,
    metrics: IMetric[],
    stacked = false
  ): GraphWidget {
    return new GraphWidget({
      title: widgetName,
      left: metrics,
      stacked: stacked,
      width: 8,
    });
  }

  private metricForApiGw(
    apiId: string,
    metricName: string,
    label: string,
    stat = 'avg'
  ): cloudwatch.Metric {
    let dimensions = {
      ApiId: apiId,
    };
    return this.buildMetric(
      metricName,
      'AWS/ApiGateway',
      dimensions,
      cloudwatch.Unit.COUNT,
      label,
      stat
    );
  }

  private buildMetric(
    metricName: string,
    namespace: string,
    dimensions: any,
    unit: cloudwatch.Unit,
    label: string,
    stat = 'avg',
    period = 900
  ): cloudwatch.Metric {
    return new cloudwatch.Metric({
      metricName,
      namespace: namespace,
      dimensions: dimensions,
      unit: unit,
      label: label,
      statistic: stat,
      period: cdk.Duration.seconds(period),
    });
  }
}
