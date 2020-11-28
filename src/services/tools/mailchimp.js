const 
    mailchimp = require("@mailchimp/mailchimp_marketing"),
    mailchimpTransactional = require('@mailchimp/mailchimp_transactional')(process.env.MAILCHIMP_API);

mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API,
    server: process.env.MAILCHIMP_SERVER,
});

module.exports = {
    mailchimp: mailchimp,
    mailchimpTransactional: mailchimpTransactional,
}