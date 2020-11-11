const 
    AWS = require('aws-sdk'),
    Cognito = new AWS.CognitoIdentityServiceProvider({ region: process.env.API_AWS_REGION });

module.exports = {
    Cognito: Cognito
}