const lambda = require('../index');

const data = {
    "batchFile": "extract/task/74667077-64b3-413f-b75a-463c48255ecc/3.json",
    "id": "arn:aws:states:ap-southeast-2:383358879677:execution:sfnWorkflowE38B1DCE-o4n9mt6Hxzn7:74667077-64b3-413f-b75a-463c48255ecc"
}

test('Runner', async () => {
    expect.assertions(1);
    return lambda.handler(data).then((res: { statusCode: any; }) => expect(res.statusCode).toEqual(200));
  });