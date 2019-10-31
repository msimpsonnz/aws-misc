# Prereqs
#Create 2 SQL 2017 EC2 instances from Marketplace AMI

$SQLInstance = ".\localhost"
$SQLDatabase = "master"
$SQLUsername = "dbadmim"
$SQLPassword = "Password!" 

$SQLQuery1 = "EXEC UpdateTickets"
$SQLQuery1Output = Invoke-Sqlcmd -query $SQLQuery1 

aws ssm send-command --document-name "AWS-ConfigureAWSPackage" --instance-ids "i-0f5a86e2612ea4bed" --parameters '{"action":["Install"],"name":["AwsVssComponents"]}'

aws ssm get-command-invocation --command-id "5c16525d-9b5c-4518-8185-a7f81cea8fdb" --instance-id "i-0f5a86e2612ea4bed"

export disk=$(aws ssm update-document \
    --name "UpdateHostStorageCache" \
    --content "file://UpdateHostStorageCache.json" \
    --document-version '$LATEST' | jq -r '.DocumentDescription.LatestVersion')

aws ssm update-document-default-version --name "UpdateHostStorageCache" --document-version $disk


export sql=$(aws ssm update-document \
    --name "SSIS" \
    --content "file://sql.json" \
    --document-version '$LATEST' | jq -r '.DocumentDescription.LatestVersion')

aws ssm update-document-default-version --name "SSIS" --document-version $sql

export doc=$(aws ssm update-document \
    --name "Restore-SQL-Run-SSIS" \
    --content "file://restore.json" \
    --document-version '$LATEST' | jq -r '.DocumentDescription.LatestVersion')

aws ssm update-document-default-version --name "Restore-SQL-Run-SSIS" --document-version $doc

aws ssm start-automation-execution --document-name "Restore-SQL-Run-SSIS" --parameters "SourceInstanceId=i-0f58cd1e250ffdb02,DestInstanceId=i-0fe7c7fdbc3e86877"

#########################

aws ssm create-document \
    --name "Restore-SQL-Run-SSIS-v2" \
    --content "file://restore_v2.json" \
    --document-type Automation


export doc=$(aws ssm update-document \
    --name "Restore-SQL-Run-SSIS-v2" \
    --content "file://restore_v2.json" \
    --document-version '$LATEST' | jq -r '.DocumentDescription.LatestVersion')

aws ssm update-document-default-version --name "Restore-SQL-Run-SSIS-v2" --document-version $doc

aws ssm start-automation-execution --document-name "Restore-SQL-Run-SSIS-v2" --parameters "SourceInstanceId=i-0f5a86e2612ea4bed,DestInstanceId=i-07393b2b066059856"