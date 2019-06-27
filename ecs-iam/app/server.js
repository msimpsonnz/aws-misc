'use strict';

const express = require('express');
const http = require('http');
const AWS = require('aws-sdk');

//Constants
const PORT = 80;
const HOST = '0.0.0.0';

// App
const credUrl = process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI

const app = express();
app.get('/', (req, res) => {

    var url = `http://169.254.170.2${credUrl}`;
    http.get(url, (resp) => {
      let data = '';
    
      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });
    
      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        console.log(JSON.parse(data));
        res.send(data);
      });
    
    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });
});

app.get('/s3', (req, res) => {
  var s3 = new AWS.S3({ params: {Bucket: 'mjsdemo-s3', Key: 'hello.json'}, apiVersion: '2006-03-01' });

s3.getObject(function(err, data) {
    // Handle any error and exit
    if (err)
        return err;

  // No error happened
  // Convert Body from a Buffer to a String

  let objectData = data.Body.toString('utf-8'); // Use the encoding necessary
  res.send(objectData);
});
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);