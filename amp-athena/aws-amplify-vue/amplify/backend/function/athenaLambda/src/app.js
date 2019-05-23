/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/
const AWS = require('aws-sdk')
const AthenaExpress = require("athena-express"),
	aws = require("aws-sdk");
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
var bodyParser = require('body-parser')
var express = require('express')

//AWS.config.update({ region: process.env.TABLE_REGION });
AWS.config.update({ region: 'ap-southeast-2' });

// declare a new express app
var app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
});

const athenaExpressConfig = {
	aws,
	db: "sampledb",
	getStats: true
};
const athenaExpress = new AthenaExpress(athenaExpressConfig);

/********************************
 * HTTP Get method for list objects *
 ********************************/
app.get('/query', (req, res) => {
  res.json(req.body)
});

app.post('/query', async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  //console.log(req.apiGateway)
  //console.log(req.apiGateway.event)
  //console.log(req)
  console.log(req.body)
  //let body = JSON.parse(req.body)
  let queryStart = "SELECT ";

  req.body.column.forEach(element => {
    console.log(element)
    queryStart = queryStart + element + ", "
  });
  let query = queryStart.substring(0, queryStart.length-2)
  query = query + " FROM elb_logs LIMIT " + req.apiGateway.event.queryStringParameters.limit;
  console.log(query);
	try {
		let results = await athenaExpress.query(query);
    console.log(results);
    res.json(results)
	} catch (error) {
		console.log(error);
  }
  
});

app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
