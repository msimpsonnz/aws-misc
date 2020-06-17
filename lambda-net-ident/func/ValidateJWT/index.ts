import {
  Context,
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerHandler,
} from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';

const certFile = require('./public-key.pem');

export const handler: APIGatewayTokenAuthorizerHandler = async (
  event: APIGatewayTokenAuthorizerEvent,
  context: Context
) => {
    console.log(JSON.stringify(event))
  let authorized = false;
  const token = event.authorizationToken.replace('Bearer ',''); 
  var cert: any = fs.readFileSync('./public-key.12dd962b.pem'); // get public key
  jwt.verify(token, cert, { audience: 'api' },function (err: any, decoded: any) {
    if (decoded != undefined) {
        console.log(decoded);
        authorized = true;
    }
  });

  const policy = generatePolicy('User', authorized, event.methodArn );
  return policy;
};

var generatePolicy = function (principalId: string, authorized: boolean, resource: string) {
  const authResponse: APIGatewayAuthorizerResult = {
    principalId: principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: authorized ? 'Allow' : 'Deny',
          Resource: resource,
        },
      ],
    },
  };

  return authResponse;
};
