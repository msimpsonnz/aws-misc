'use strict';
console.log('Loading function');

exports.handler =  async function(event, context) {
  let success = 0; // Number of valid entries found
  let failure = 0; // Number of invalid entries found
  let dropped = 0; // Number of dropped entries

  /* Process the list of records and transform them */
  const output = event.records.map((record) => {
    console.log(record)
    const entry = new Buffer.from(record.data, 'base64').toString('utf8');
    let jsonEntry = JSON.parse(entry);
    if (jsonEntry.action === 'BLOCK') {
        dropped++;
        return {
          recordId: record.recordId,
          result: 'Dropped',
          data: record.data,
        };
      } else {
        /* Transformed event */
        success++;
        return {
          recordId: record.recordId,
          result: 'Ok',
          data: record.data,
        };
      }
    // } else {
    //   /* Failed event, notify the error and leave the record intact */
    //   console.log('Failed event : ' + record.data);
    //   failure++;
    //   return {
    //     recordId: record.recordId,
    //     result: 'ProcessingFailed',
    //     data: record.data,
    //   };
    // }
    /* This transformation is the "identity" transformation, the data is left intact 
        return {
            recordId: record.recordId,
            result: 'Ok',
            data: record.data,
        } */
  });
  console.log(`Processing completed.  Successful records ${success}.`);
  console.log(`Processing completed.  Dropped records ${dropped}.`);
  return { records: output };
};
