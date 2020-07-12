const fs = require('fs').promises; 
const parse = require('csv-parse');
import { SQS } from "aws-sdk";
var sqs = new SQS({ region: process.env.AWS_REGION });

export const QueueLoader = async function () {

    // (async function(){
    //     // Prepare the dataset
    //     const content = await fs.readFile(`./test/test1.csv`)
    //     // Parse the CSV content
    //     const records = parse(content)
    //     // Print records to the console
    //     console.log(records)
    //   })()

    const data: any[] = [
        "0.09178,0.0,4.05,0.0,0.51,6.416,84.1,2.6463,5.0,296.0,16.6,395.5,9.04",
        "0.05644,40.0,6.41,1.0,0.447,6.758,32.9,4.0776,4.0,254.0,17.6,396.9,3.53",
        "0.10574,0.0,27.74,0.0,0.609,5.983,98.8,1.8681,4.0,711.0,20.1,390.11,18.07",
        "0.09164,0.0,10.81,0.0,0.413,6.065,7.8,5.2873,4.0,305.0,19.2,390.91,5.52"

    ]

    for (let index = 0; index < data.length; index++) {
        const element = data[index];
                var params = {
            MessageBody: element,
            QueueUrl: 'https://sqs.ap-southeast-2.amazonaws.com/383358879677/SagePredictInfraStack-queue276F7297-REGVSVKWOX76'
        }
        sqs.sendMessage(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);           // successful response
          });
        
    }



        // var params = {
        //     MessageBody: csvrow,
        //     QueueUrl: 'https://sqs.ap-southeast-2.amazonaws.com/383358879677/SagePredictInfraStack-queue276F7297-REGVSVKWOX76'
        // }
        // sqs.sendMessage(params, function(err, data) {
        //     if (err) console.log(err, err.stack); // an error occurred
        //     else     console.log(data);           // successful response
        //   });


}