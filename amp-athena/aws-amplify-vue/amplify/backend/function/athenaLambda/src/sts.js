AWS = require("aws-sdk")

async function getSTS (event){
    const sts = new AWS.STS({ region: 'ap-southeast-2' });
    const params = {
      RoleArn: event.requestContext.authorizer.claims.cognito.roles,
      RoleSessionName: 'CognitoCredentials',
    };
    console.log('Prepare to assume role: ' + params.RoleArn)
  
  const assumeRole = await sts.assumeRole(params).promise();
  console.log('Assume Role');
  console.log(assumeRole.Credentials.AccessKeyId)
  console.log(assumeRole.Credentials.SecretAccessKey)
  
  
      awsCredentials = { 
          region: "ap-southeast-2",
          accessKeyId: "assumeRole.Credentials.AccessKeyId",
          secretAccessKey: "assumeRole.Credentials.SecretAccessKey"
      };
  
  aws.config.update(awsCredentials);
  };
  
  module.exports.getSTS = getSTS;