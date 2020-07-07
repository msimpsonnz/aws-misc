const func = require('../index');


test('Test Runner', async () => {
    expect.assertions(1);
    return func.QueueLoader().then((res: { ContentType: any; }) => expect(res.ContentType).toEqual('text/csv; charset=utf-8'));
  });