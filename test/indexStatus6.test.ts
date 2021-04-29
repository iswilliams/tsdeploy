'use strict';
import fs = require('fs');

import { handler } from '../index';

jest.mock('mysql', () => {
    return {
        createConnection: (x: any) => {
            return {
                query: (a: any, b: any, cb: any) => {
                     // Exectue Resolve for the callback
                     if (a.includes('SELECT ')) {
                        return cb(null, [{
                            id_estado: 123,
                            nombre_estado: 'EN REPARTO',
                            estado_transporte: 1,
                            id_transporte: 1,

                        }]);
                    } else {
                        return cb(null, { insertId: 1 });
                    }
                }
            }
        }
    }
});

jest.mock('aws-sdk', () => {
    return {
        Endpoint: jest.fn().mockImplementation((x) => { return x }),
        config: {
            logger: '',
            update: (x: any) => 'update'
        },
        SQS: jest.fn().mockImplementation(() => {
            return {
                sendMessage: (a: any, cb: any) => {
                    return cb(null, 'enviado')
                }
            }
        })
    }
});

describe('Lambda Control Guardia', () => {

    test('Camino Feliz Exito', async () => {
        let rawdata = fs.readFileSync('control_guardia.json');
        let input = JSON.stringify(JSON.parse(rawdata.toString()));
        const payload = {
            "Records": [
                {
                    "messageId": "MessageID_1",
                    "receiptHandle": "MessageReceiptHandle",
                    "body": input,
                    "md5OfBody": "fce0ea8dd236ccb3ed9b37dae260836f",
                    "md5OfMessageAttributes": "582c92c5c5b6ac403040a4f3ab3115c9",
                    "eventSourceARN": "arn:aws:sqs:us-west-2:123456789012:SQSQueue",
                    "eventSource": "aws:sqs",
                    "awsRegion": "us-west-2",
                }
            ]
        };
        let context = {
            succeed: (x: string) => '',
            fail: () => ''
        }
        await handler(payload, context);
        expect(3).toBe(3);
    });

});