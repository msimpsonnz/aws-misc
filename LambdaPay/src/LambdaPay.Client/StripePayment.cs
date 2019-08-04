using System;
using System.IO;
using System.Threading.Tasks;
using Amazon;
using Amazon.SecretsManager;
using Amazon.SecretsManager.Model;

using Stripe;

namespace LambdaPay.Client
{
    public class StripePayment
    {
        private readonly TokenService _tokenService;
        private readonly ChargeService _chargeService;

        public StripePayment(string stripeApiKey)
        {
            StripeConfiguration.ApiKey = stripeApiKey;
            _tokenService =  new TokenService();
            _chargeService = new ChargeService();
        }


        public bool MakePayment(string card, string email)
        {
            //Don't do this should be securesrtring or encrypted
            var token = CreateStripeCardToken(card);
            var payment = MakeStripePayment(token, email);
            return payment.Paid;

        }

        public Token CreateStripeCardToken(string card)
        {
            var options = new TokenCreateOptions {
                Card = new CreditCardOptions {
                    Number = card,
                    ExpYear = 2020,
                    ExpMonth = 8,
                    Cvc = "123"
                }
            };

            Token stripeToken = _tokenService.Create(options);
            return stripeToken;
        }
    

        public Charge MakeStripePayment(Token token, string email)
        {

            var options = new ChargeCreateOptions
            {
                Amount = 2000,
                Currency = "usd",
                Description = $"Charge for {email}",
                Source = token.Id
            };

            Charge charge = _chargeService.Create(options);
            return charge;
        }

    }
}
