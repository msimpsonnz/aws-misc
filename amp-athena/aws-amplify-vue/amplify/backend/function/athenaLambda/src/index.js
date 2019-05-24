const awsServerlessExpress = require('aws-serverless-express');
const app = require('./app');
const sts = require('./sts');

const server = awsServerlessExpress.createServer(app);

exports.handler = (event, context) => {
  
  console.log(`EVENT: ${JSON.stringify(event)}`);
  awsServerlessExpress.proxy(server, event, context);
};
