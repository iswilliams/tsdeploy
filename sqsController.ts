import AWS = require('aws-sdk');

import { aws_sdk, sqsConfig } from './config';
import { Response } from "./types";

const endpoint = `http://${aws_sdk.ip}:${aws_sdk.port}/`;
const MAX_RETRY = process.env.MAX_RETRY || 1;

//Configuración de AWS
const configSdk = {
  endpoint: new AWS.Endpoint(endpoint),
  accessKeyId: aws_sdk.accessKeyId,
  secretAccessKey: aws_sdk.secretAccessKey,
  region: aws_sdk.region
};

AWS.config.logger = console;
AWS.config.update(configSdk);
const sqs = new AWS.SQS;

const sendEventToSQS = async (body: Response) => {
  return new Promise((resolve, reject) => {
    try {

      const QueueUrl = `${endpoint}${sqsConfig.awsId}/${sqsConfig.queueName}`
      const params = {
        MessageBody: JSON.stringify(body),
        QueueUrl: QueueUrl,
        MessageGroupId: 'default',
      };

      sqs.sendMessage(params, function (err, data) {
        if (err) {
          //console.log(err);
          reject(err);
        }
        else resolve(data)
      });
    } catch (err) {
      reject(err)
    }
  })
}

const execRetrySQS = async (body: Response) => {
  let currentRetry = 1;
  while (currentRetry <= MAX_RETRY) {
    try {
      currentRetry++;
      //console.log('Send message...');
      const result = await sendEventToSQS(body);
      //console.log('Message successfully');
      return result;
    } catch (err) {
      // Pintar informacion a cloudwatch
      //console.log("error ---> " + err);
      console.info('Failed sending the message: Retry N°' + (currentRetry - 1));
    }
  }
  throw new Error('Failed sending the message');
}

export { execRetrySQS }