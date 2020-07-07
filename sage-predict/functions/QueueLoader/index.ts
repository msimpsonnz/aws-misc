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
        "0,29,3,999,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,1,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0",
"1,60,2,6,1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1",
"0,36,4,999,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,0,1,0,0,1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0",
"1,42,1,999,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,1,1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0",
"0,27,1,999,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,1,0,1,0,0,1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0",
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