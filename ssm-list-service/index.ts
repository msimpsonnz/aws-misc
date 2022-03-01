import { SSMClient, GetParametersByPathCommand, GetParametersByPathCommandInput } from "@aws-sdk/client-ssm";
const { Parser } = require('json2csv');
const fs = require('fs')

const region = process.env.AWS_REGION || "ap-southeast-2";
const client = new SSMClient({ region: region });
const lookupRegion = process.env.AWS_LOOKUP_REGION || "ap-southeast-2";

export const handler = async () => {
    console.log(JSON.stringify(lookupRegion));
    let res: Service[] = [];
    let hasNext = false;
    let nextToken = '';

    const initialCommandInput: GetParametersByPathCommandInput = {
        Path: `/aws/service/global-infrastructure/regions/${lookupRegion}/services`
    };
    const command = new GetParametersByPathCommand(initialCommandInput);
    const data = await client.send(command);
    data.Parameters?.forEach(param => {
        res.push({
            region: lookupRegion,
            serviceName: param.Value!,
            lastModifiedDate: param.LastModifiedDate!.toISOString()
        });
    });
    if (data.NextToken != undefined) {
        hasNext = true;
        nextToken = data.NextToken;
    }

    while (hasNext) {
        const nextCommandInput: GetParametersByPathCommandInput = {
            Path: `/aws/service/global-infrastructure/regions/${lookupRegion}/services`,
            NextToken: nextToken
        };
        const nextCommand = new GetParametersByPathCommand(nextCommandInput);
        const nextData = await client.send(nextCommand);
        nextData.Parameters?.forEach(param => {
            res.push({
                region: lookupRegion,
                serviceName: param.Value!,
                lastModifiedDate: param.LastModifiedDate!.toISOString()
            });
        });
        console.log(res.length);
        if (nextData.NextToken === undefined) {
            hasNext = false;
            console.log(hasNext);
        } else {
            nextToken = nextData.NextToken;
        }
    }

    console.log(JSON.stringify(res));
    const date = new Date();
    const timestamp = date.toISOString().split('T')[0];



    const fields = ['region', 'serviceName', 'lastModifiedDate'];
    const opts = { fields };
    try {
        const parser = new Parser(opts);
        const csv = parser.parse(res);
        fs.writeFileSync(`${timestamp}-${lookupRegion}.csv`, csv)
    } catch (err) {
        console.error(err);
    }
}

interface Service {
    region: string;
    serviceName: string;
    lastModifiedDate: string;
}

//Run
handler().then(x => console.log("DONE"));