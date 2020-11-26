import os
import boto3
from botocore.exceptions import ClientError
import json
from urllib.parse import unquote_plus

extractBucket = os.environ['AWS_S3_BUCKET_NAME']

def handler(event, context):
    # Instantiate boto client
    s3Client = boto3.client('s3')
    
    # Parse job parameters from S3 Batch Operations
    jobId = event['job']['id']
    invocationId = event['invocationId']
    invocationSchemaVersion = event['invocationSchemaVersion']
    
    # Prepare results
    results = []
    
    # Parse Amazon S3 Key, Key Version, and Bucket ARN
    task = event['tasks'][0]

    # Extract the task values we might want to use
    taskId = task['taskId']
    s3Key = task['s3Key']
    s3VersionId = task['s3VersionId']
    s3BucketArn = task['s3BucketArn']
    s3BucketName = s3BucketArn.split(':::')[-1]
    
    # Copy object to new bucket with new key name
    try:
        # Prepare result code and string
        resultCode = None
        resultString = None
        
        # Construct New Key
        s3Key_decoded = unquote_plus(s3Key)
        keyJson = json.loads(s3Key_decoded)
        newKey = keyJson['extractKey']
        origKey = keyJson['sourceKey']

        newBucket = extractBucket

        # Construct CopySource with VersionId
        copySrc = {'Bucket': s3BucketName, 'Key': origKey}
        if s3VersionId is not None:
            copySrc['VersionId'] = s3VersionId
        
        
        # Copy Object to New Bucket
        response = s3Client.copy_object(
            CopySource = copySrc,
            Bucket = newBucket,
            Key = newKey
        )
        
        # Mark as succeeded
        resultCode = 'Succeeded'
        resultString = str(response)
    except ClientError as e:
        # If request timed out, mark as a temp failure
        # and S3 Batch Operations will make the task for retry. If
        # any other exceptions are received, mark as permanent failure.
        errorCode = e.response['Error']['Code']
        errorMessage = e.response['Error']['Message']
        if errorCode == 'RequestTimeout':
            resultCode = 'TemporaryFailure'
            resultString = 'Retry request to Amazon S3 due to timeout.'
        else:
            resultCode = 'PermanentFailure'
            resultString = '{}: {}'.format(errorCode, errorMessage)
    except Exception as e:
        # Catch all exceptions to permanently fail the task
        resultCode = 'PermanentFailure'
        resultString = 'Exception: {}'.format(e.message)
    finally:
        results.append({
            'taskId': taskId,
            'resultCode': resultCode,
            'resultString': resultString
        })
    
    return {
        'invocationSchemaVersion': invocationSchemaVersion,
        'treatMissingKeysAs': 'PermanentFailure',
        'invocationId': invocationId,
        'results': results
    }