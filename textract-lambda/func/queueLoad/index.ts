import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import { SQS } from "aws-sdk";

const sqs = new SQS({ region: "ap-southeast-2" });

async function load() {
  const file: string[] = [];
  for (let index = 0; index < 50; index++) {
    const id = `${uuidv4()}.jpg`;
    fs.copyFileSync("./twocolumn.jpg", `./images/${id}`);
    file.push(id);
  }
  const js = JSON.stringify(file);

  fs.writeFileSync("fileList.json", js);

  console.log(js);
}

// load().then(l => {
//     console.log("done");
// })
class QueueEntry {
  id!: Number;
  queueBody!: QueueBody;
}

class QueueBody {
  payload!: QueuePayload;
}

class QueuePayload {
  key!: String;
  bucket!: String;
  context!: String;
}

async function sqsLoad() {
  var obj = JSON.parse(fs.readFileSync("fileList.json", "utf8"));

  let queueData: QueueEntry[] = [];
  let _id = 0;

  obj.forEach((f: String) => {
    const payloadData: QueueEntry = {
      id: _id,
      queueBody: {
        payload: {
          key: `textract/${f}`,
          bucket: "mjs-syd",
          context: "context",
        },
      },
    };
    queueData.push(payloadData);
    _id++;
  });

  let sqsBatchList: SQS.SendMessageBatchRequestEntry[] = [];

  queueData.forEach(async (msg) => {
    //console.log(JSON.stringify(msg));
    const entry: SQS.SendMessageBatchRequestEntry = {
      Id: msg.id.toString(),
      MessageBody: JSON.stringify(msg.queueBody),
    };
    sqsBatchList.push(entry);
  });

  var chunks = function(array: any, size: Number) {
    var results = [];
    while (array.length) {
      results.push(array.splice(0, size));
    }
    return results;
  };

  const batches = chunks(sqsBatchList, 10);

  batches.forEach(element => {
    console.log(element.length);
  });
  //console.log(JSON.stringify(batches));

  const debug: Boolean = false;

  if (debug) {
    let sqsSingleList: SQS.SendMessageBatchRequestEntry[] = [];
    sqsSingleList.push(batches[0][0]);
    const sqsSingle: SQS.SendMessageBatchRequest = {
      QueueUrl: "https://sqs.ap-southeast-2.amazonaws.com/383358879677/TextractLambdaStack-AsyncJobsE9347181-V5GDJK2ZHH00",
      Entries: sqsSingleList
    };
    console.log(JSON.stringify(sqsSingle));
    const msgReq = await sqs.sendMessageBatch(sqsSingle).promise();
    console.log(msgReq.$response);
    
  } else {
    batches.forEach(async (batch) => {
      const sqsBatch: SQS.SendMessageBatchRequest = {
          QueueUrl: "https://sqs.ap-southeast-2.amazonaws.com/383358879677/TextractLambdaStack-AsyncJobsE9347181-V5GDJK2ZHH00",
          Entries: batch
        };
      const msgReq = await sqs.sendMessageBatch(sqsBatch).promise();
      console.log(msgReq.$response);
    })
    
  }

    // const msgReq = await sqs.sendMessageBatch(sqsBatch).promise();
    // console.log(msgReq.$response);

  //console.log(JSON.stringify(sqsBatch));
}

sqsLoad().then((l) => {
  console.log("done");
});
