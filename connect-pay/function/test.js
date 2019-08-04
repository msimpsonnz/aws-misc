const Payment = require("./payment.js");
//4242-4242-4242-4242// 
let card = '4242424242424242'
async function getToken(card) {
    const tkResult = await Payment.createToken(card);
    console.log(tkResult.id)
    return tkResult.id;
}
let respose = "";
getToken(card).then(async (tk) => {
    const tkResult = await Payment.createCharge(tk);
    respose = tkResult.outcome.seller_message
    console.log(respose)
  });

