const stripe = require("stripe")("");

const Payment = {
    async createToken(card) {
        const token = await stripe.tokens.create({
            card: {
                number: card,
                exp_month: 12,
                exp_year: 2020,
                cvc: '123'
            }
        });
        console.log(token);
        return token;
    },
    async createCharge(tokenId) {
        console.log(tokenId)
        const charge = await stripe.charges.create({
            amount: 2000,
            currency: "nzd",
            source: tokenId,
            description: "Charge from Amazon Connect"
        });
        console.log(charge);
        return charge;
    }
}

module.exports = Payment;