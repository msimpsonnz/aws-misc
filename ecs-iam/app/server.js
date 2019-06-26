'use strict';

const express = require('express');
const request = require('request');

// Constants
const PORT = 80;
const HOST = '0.0.0.0';

// App
const credUrl = process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI

const app = express();
app.get('/', (req, res) => {
    request.get(`http://169.254.170.2${credUrl}`);
    res.send(request);
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);