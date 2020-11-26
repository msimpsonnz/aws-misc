### Seed S3
export sourceBucket=s3batchstack-s3sourcebucketfc7c9179-17yn20tkt0udi
#mkdir data/s3
#touch ./data/s3/{0..9}.txt
aws s3 cp ./data/s3 s3://$sourceBucket/data/ --recursive

### Seed DDB
cd ./functions/seedData
npm i
node index.js


###
curl -X POST -d "{\"Records\":[{\"recordId\":\"0\",\"extractKey\":\"ex0\"},{\"recordId\":\"1\",\"extractKey\":\"ex1\"},{\"recordId\":\"2\",\"extractKey\":\"ex2\"},{\"recordId\":\"3\",\"extractKey\":\"ex3\"},{\"recordId\":\"4\",\"extractKey\":\"ex4\"},{\"recordId\":\"5\",\"extractKey\":\"ex5\"},{\"recordId\":\"6\",\"extractKey\":\"ex6\"},{\"recordId\":\"7\",\"extractKey\":\"ex7\"},{\"recordId\":\"8\",\"extractKey\":\"ex8\"},{\"recordId\":\"9\",\"extractKey\":\"ex9\"}]}" https://od1pnvia5m.execute-api.ap-southeast-2.amazonaws.com/workflow

curl -X POST -d "{\"Records\":[{\"recordId\":\"0\",\"extractKey\":\"ex0\"}]}" https://od1pnvia5m.execute-api.ap-southeast-2.amazonaws.com/workflow

curl -X POST -d "{\"Records\":[{\"recordId\":\"0\",\"extractKey\":\"ex0\"},{\"recordId\":\"1\",\"extractKey\":\"ex1\"},{\"recordId\":\"2\",\"extractKey\":\"ex2\"},{\"recordId\":\"3\",\"extractKey\":\"ex3\"},{\"recordId\":\"4\",\"extractKey\":\"ex4\"}]}" https://od1pnvia5m.execute-api.ap-southeast-2.amazonaws.com/workflow

