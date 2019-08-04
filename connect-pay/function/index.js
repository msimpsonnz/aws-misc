const Utils = require("./utils.js");
const Payment = require("./payment.js")

exports.handler = async (event) => {
    // TODO implement
    // console.log('From Connect ==>',JSON.stringify(event,null,4));
    const dt=Date.now();
    let privateKey = await Utils.getPrivateKey();
    if (!privateKey) {
        return {
            statusCode: 500,
            body: "Missing Private Key",
        };
    }
    
    console.log(` ${Date.now()-dt} milliseconds`);
    let encryptedData = event.Details.ContactData.Attributes.EncryptedCreditCard;
    var decryptedData = '';
    if (encryptedData && encryptedData.length>1) {
        decryptedData =  await Utils.decryptDataUsingPrivateKey(encryptedData,privateKey);
    } else {
        console.log("No data provided!")
        decryptedData =encryptedData;
    }
    console.log(decryptedData)

    let token = ''
    token = await Payment.createToken(decryptedData);
    console.log("Token: " + token.id)

    let stripeRespose = "";
    stripeRespose = await Payment.createCharge(token.id);
    console.log("Stripe Response: " + stripeRespose.outcome.seller_message)

    console.log(`Finished in ${Date.now()-dt} milliseconds`);
    
    const response = {
        statusCode: 200,
        body: stripeRespose.outcome.seller_message,
    };
    return response;
};
