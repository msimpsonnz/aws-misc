const lambda = require('../index');

test('Runner', async () => {
    expect.assertions(1);
    return lambda.handler().then((res: { statusCode: any; }) => expect(res.statusCode).toEqual(200));
  });