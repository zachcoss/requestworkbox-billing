const 
    AWS = require('aws-sdk'),
    SQS = new AWS.SQS({ region: process.env.API_AWS_REGION });

module.exports = {
    SQS: SQS
}