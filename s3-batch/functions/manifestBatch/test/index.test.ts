const lambda = require('../index');

let rec = []
for (let index = 0; index < 10; index++) {
    const item = {
        recordId: index.toString(),
        extractKey: `ex${index}`
    }
    rec.push(item)
}

const data = {
    Records: rec
} 

test('Runner', async () => {
    expect.assertions(1);
    return lambda.handler(data).then((res: { statusCode: any; }) => expect(res.statusCode).toEqual(200));
  });