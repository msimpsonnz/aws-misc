

const AWS = require('aws-sdk');
const NodeRSA = require('node-rsa');
const AWSEncryptionSDKHelper = require("awsencryptionsdk-js");
const ssm = new AWS.SSM();
const PARAM_PRIVATE_KEY = "CONNECT_INPUT_DECRYPTION_KEY";
const STRING_ENCODING = 'utf8';

const Utils = {
  async getPrivateKey() {
    var params = {
      Name: PARAM_PRIVATE_KEY,
      WithDecryption: true 
    };
    var data = await ssm.getParameter(params).promise();
    // console.log(data);
    var privateKey='';
    if (data && data.Parameter) {
      privateKey= data.Parameter.Value;
    } else {
      return null;
    }
    // console.log("PrivateKey => ", privateKey);
    return privateKey;
  },
  async decryptDataUsingPrivateKey(cipherText,PrivateKey) {
      
    let awsEncryptionHelper = new AWSEncryptionSDKHelper(PrivateKey,cipherText);
    var data = await awsEncryptionHelper.decrypt();

    var frames = data.body.frames;
    frames.sort(function(a, b){return parseInt(a.seq) - parseInt(b.seq)});
    var decipheredText = '';
    for (var i=0 ; i<frames.length; i++) {
      decipheredText += data.body.frames[i].text;
    }
    console.log('body: ',data.body);
    return decipheredText + data.body.lastFrame.text;
  },

}


module.exports = Utils;