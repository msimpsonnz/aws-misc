Create user in RDS
CREATE USER 'rdsuser'@'%' IDENTIFIED BY 'user_password';
GRANT ALL ON '%'.* TO 'rdsuser_clone'@'%';
ALTER USER 'rdsuser'@'%' IDENTIFIED BY 'zCYf7;}ET2{cdlR(EOFbGwFrF^}?6S'

```
aws secretsmanager describe-secret --secret-id myUserSecret147559ED-N0t2Dbss7gie
```

aws secretsmanager update-secret-version-stage -–secret-id myUserSecret147559ED-N0t2Dbss7gie -–remove-from-version-id 5f48cbc7-2cf5-492b-aba0-2fc27d299b3d -–version-stage AWSPENDING

aws secretsmanager update-secret-version-stage --secret-id myUserSecret147559ED-N0t2Dbss7gie \
  --version-stage AWSPENDING \
  --remove-from-version-id 5f48cbc7-2cf5-492b-aba0-2fc27d299b3d