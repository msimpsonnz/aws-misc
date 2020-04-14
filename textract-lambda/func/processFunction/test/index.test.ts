const lambda = require('../index');
const records = require('sample.json');

const event = {
  records
}

test('Get S3 Signed Url', async () => {
  expect.assertions(1);
  return lambda.handler(event).then((res: { statusCode: any; }) => expect(res.statusCode).toEqual(200));
});