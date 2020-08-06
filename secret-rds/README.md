Create user in RDS
CREATE USER 'rdsuser'@'%' IDENTIFIED BY 'user_password';
GRANT ALL ON '%'.* TO 'rdsuser_clone'@'%';
ALTER USER 'rdsuser'@'%' IDENTIFIED BY 'zCYf7;}ET2{cdlR(EOFbGwFrF^}?6S'

```
aws secretsmanager describe-secret --secret-id myUserSecret147559ED-N0t2Dbss7gie
```

export APIURL=https://uosskxhq4e.execute-api.ap-southeast-2.amazonaws.com/
for i in {0..1000}
  do
    timestamp=$(date "+%Y-%m-%d-%H-%M")
    curl ${APIURL}${timestamp}-${i}
    sleep 3
  done



aws secretsmanager update-secret-version-stage -–secret-id myUserSecret147559ED-N0t2Dbss7gie -–remove-from-version-id 5f48cbc7-2cf5-492b-aba0-2fc27d299b3d -–version-stage AWSPENDING

aws secretsmanager update-secret-version-stage --secret-id myUserSecret147559ED-N0t2Dbss7gie \
  --version-stage AWSPENDING \
  --remove-from-version-id 5f48cbc7-2cf5-492b-aba0-2fc27d299b3d