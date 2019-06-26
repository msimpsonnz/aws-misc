'use strict';

const express = require('express');
const request = require('request');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();
app.get('/', (req, res) => {
    request.get(`http://169.254.170.2${AWS_CONTAINER_CREDENTIALS_RELATIVE_URI}`);
    res.send();
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);