
var jwt = require('jsonwebtoken');
const https = require('https');

var token = jwt.sign({
    exp: Math.floor(Date.now() / 1000) + (60 * 60),
    //exp: Math.floor(Date.now() / 1000)
  }, 'secret');

const options = {
  hostname: '<API Gateway Endpoint>',
  port: 443,
  path: '/prod/pets',
  method: 'GET',
  auth: token
}

console.log(options)

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`)

  res.on('data', d => {
    process.stdout.write(d)
  })
})

req.on('error', error => {
  console.error(error)
})

req.end()

// var result = ''

// jwt.verify(token, 'secret', function (err, decoded) {
//     if (err) {
//         console.log('failed jwt verify: ', err, 'auth: ', token);
//         result = 'deny'
//     }
//     else {
//         result = 'allow'
//     }
// });

// console.log(result)

// var event = {
//   authorizationToken: 'Basic ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmxlSEFpT2pFMU56RXdPRGt6TlRRc0ltbGhkQ0k2TVRVM01UQTROVGMxTkgwLnZDanVCUmNPMktzMzZhU05nU0pMbnJ4LWhzb0ljYkYzUlBwWUpoQlZObjQ='
// }

// var data = new Buffer.from(event.authorizationToken.replace('Basic ', ''), 'base64').toString('ascii');;

// console.log(data)