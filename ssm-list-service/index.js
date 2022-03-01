"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
var client_ssm_1 = require("@aws-sdk/client-ssm");
var Parser = require('json2csv').Parser;
var fs = require('fs');
var region = process.env.AWS_REGION || "ap-southeast-2";
var client = new client_ssm_1.SSMClient({ region: region });
var lookupRegion = process.env.AWS_LOOKUP_REGION || "ap-southeast-2";
var handler = function () { return __awaiter(void 0, void 0, void 0, function () {
    var res, hasNext, nextToken, initialCommandInput, command, data, nextCommandInput, nextCommand, nextData, date, timestamp, fields, opts, parser, csv;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                console.log(JSON.stringify(lookupRegion));
                res = [];
                hasNext = false;
                nextToken = '';
                initialCommandInput = {
                    Path: "/aws/service/global-infrastructure/regions/" + lookupRegion + "/services"
                };
                command = new client_ssm_1.GetParametersByPathCommand(initialCommandInput);
                return [4 /*yield*/, client.send(command)];
            case 1:
                data = _c.sent();
                (_a = data.Parameters) === null || _a === void 0 ? void 0 : _a.forEach(function (param) {
                    res.push({
                        region: lookupRegion,
                        serviceName: param.Value,
                        lastModifiedDate: param.LastModifiedDate.toISOString()
                    });
                });
                if (data.NextToken != undefined) {
                    hasNext = true;
                    nextToken = data.NextToken;
                }
                _c.label = 2;
            case 2:
                if (!hasNext) return [3 /*break*/, 4];
                nextCommandInput = {
                    Path: "/aws/service/global-infrastructure/regions/" + lookupRegion + "/services",
                    NextToken: nextToken
                };
                nextCommand = new client_ssm_1.GetParametersByPathCommand(nextCommandInput);
                return [4 /*yield*/, client.send(nextCommand)];
            case 3:
                nextData = _c.sent();
                (_b = nextData.Parameters) === null || _b === void 0 ? void 0 : _b.forEach(function (param) {
                    res.push({
                        region: lookupRegion,
                        serviceName: param.Value,
                        lastModifiedDate: param.LastModifiedDate.toISOString()
                    });
                });
                console.log(res.length);
                if (nextData.NextToken === undefined) {
                    hasNext = false;
                    console.log(hasNext);
                }
                else {
                    nextToken = nextData.NextToken;
                }
                return [3 /*break*/, 2];
            case 4:
                console.log(JSON.stringify(res));
                date = new Date();
                timestamp = date.toISOString().split('T')[0];
                fields = ['region', 'serviceName', 'lastModifiedDate'];
                opts = { fields: fields };
                try {
                    parser = new Parser(opts);
                    csv = parser.parse(res);
                    fs.writeFileSync(timestamp + "-" + lookupRegion + ".csv", csv);
                }
                catch (err) {
                    console.error(err);
                }
                return [2 /*return*/];
        }
    });
}); };
exports.handler = handler;
//Run
(0, exports.handler)().then(function (x) { return console.log("DONE"); });
