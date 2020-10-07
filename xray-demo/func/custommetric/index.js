var AWS = require('aws-sdk');
var cw = new AWS.CloudWatch({ apiVersion: '2010-08-01' });

exports.handler = async function (event) {
  console.log('request:', JSON.stringify(event, undefined, 2));

  var params = {
    MetricData: [
      {
        MetricName: 'CODE_PIPELINE_DEPLOY',
        Dimensions: [
          {
            Name: 'DEPLOY',
            Value: 'SUCCESS',
          },
        ],
        Unit: 'Count',
        Value: 1.0,
      },
    ],
    Namespace: 'XRAY_DEMO',
  };

  await cw.putMetricData(params).promise();

  var params = {
    DashboardName: 'CloudWatchDashBoard043C60B6-b4MABsAI1Ink' /* required */,
  };

  const dash = await cw.getDashboard(params).promise();
  let dashboardBody = JSON.parse(dash.DashboardBody);
  dashboardBody.widgets.forEach((metric) => {
    const annotate = {
      color: '#2ca02c',
      label: 'Deployment',
      value: event.time,
    };
    metric.properties.annotations.vertical.push(annotate)
    console.log(JSON.stringify(metric));
  });

  console.log(JSON.stringify(dashboardBody));

  var putParams = {
    DashboardBody: JSON.stringify(dashboardBody) /* required */,
    DashboardName: 'CloudWatchDashBoard043C60B6-b4MABsAI1Ink' /* required */,
  };

  const put = await cw.putDashboard(putParams).promise();
  console.log(JSON.stringify(put));
};
