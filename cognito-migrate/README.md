# Cognito


go run CreateUser.go -e m.simpson@outlook.com -p ap-southeast-2_0y2sKReFQ -n matt


aws cognito-idp admin-set-user-password \
  --user-pool-id ap-southeast-2_0y2sKReFQ \
  --username matt \
  --password Temp0y2sKReFQ# \
  --permanent


go run InitiateAuth.go -a 18664ro6ifsrokvgajgei41bdv -s q3h98j0pk8d1p96v0reu9odugkr3sfe9c3ubsflenc3sfq8l7vt -n matt -p Temp0y2sKReFQ#

