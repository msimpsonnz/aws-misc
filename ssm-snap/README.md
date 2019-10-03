# Prereqs
#Create 2 SQL 2017 EC2 instances from Marketplace AMI

$SQLInstance = ".\localhost"
$SQLDatabase = "master"
$SQLUsername = "dbadmim"
$SQLPassword = "Password!" 

$SQLQuery1 = "EXEC UpdateTickets"
$SQLQuery1Output = Invoke-Sqlcmd -query $SQLQuery1 

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