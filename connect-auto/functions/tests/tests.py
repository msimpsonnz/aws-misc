# import boto3
# import stripe

# session = boto3.Session(region_name='ap-southeast-2')
# client = session.client('ssm')

# response = client.get_parameter(
#     Name='StripeApiKey',
#     WithDecryption=True
# )

# stripe.api_key = response['Parameter']['Value']

# # # token = stripe.Token.create(
# # #   card={
# # #     'number': '4242424242424242',
# # #     'exp_month': 12,
# # #     'exp_year': 2020,
# # #     'cvc': '123',
# # #   },
# # # )
# # # print(f"{token['id']}")


# # # token = stripe.Token.create(
# # #   card={
# # #     'number': '4242424242424242',
# # #     'exp_month': 12,
# # #     'exp_year': 2020,
# # #     'cvc': '123',
# # #   },
# # # )

# charge = stripe.Charge.create(
#   amount=2000,
#   currency="nzd",
#   customer=customer['id'],
#   source=customer['sources']['data'][0]['id'],
#   description=f"Charge for {customer['phone']}"
# )

# # print(charge)
# event = { "Details": { "Parameters": { "Amount": "18.90"} }}
# rawAmount = event["Details"]["Parameters"]["Amount"]
# print(float(rawAmount))

# amountFloat = int(round(float(rawAmount), 2) * 100)
# print(amountFloat)


import boto3
import aws_encryption_sdk
from aws_encryption_sdk.key_providers.raw import RawMasterKeyProvider

session = boto3.Session(region_name='ap-southeast-2')
client = session.client('ssm')

priv_response = client.get_parameter(
    Name='CONNECT_INPUT_DECRYPTION_KEY',
    WithDecryption=True
)

pub_response = client.get_parameter(
    Name='CONNECT_ENCRYPTION_KEY',
    WithDecryption=True
)

privateKey = priv_response['Parameter']['Value']
print(privateKey)
publicKey = pub_response['Parameter']['Value']
print(publicKey)


key_provider = RawMasterKeyProvider(publicKey)

my_plaintext = b'This is some super secret data!  Yup, sure is!'

my_ciphertext, encryptor_header = aws_encryption_sdk.encrypt(
    source=my_plaintext,
    key_provider=key_provider
)
