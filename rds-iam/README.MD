## Prerequisites

Install AWS CDK
Install SQLWorkbench/J

Deploy CDK stack

## Create IAM User
Access Aurora using SQLWorkbench/J

```sql
CREATE USER rds_admin IDENTIFIED WITH AWSAuthenticationPlugin AS 'RDS'; 
```

java -jar D:\temp\Workbench-Build125\sqlworkbench.jar -script='employees.sql' -profile=Aurora -abortOnError=false