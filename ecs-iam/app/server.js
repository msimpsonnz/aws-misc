'use strict';

const express = require('express');
const http = require('http');

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
        res.send(JSON.stringify(data));
      });
    
    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);