const 
    mailchimp = require("@mailchimp/mailchimp_marketing");

mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API,
    server: process.env.MAILCHIMP_SERVER,
});

module.exports = {
    mailchimp: mailchimp,
}