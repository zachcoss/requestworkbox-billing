const 
    express = require('express'),
    router = express.Router(),
    bodyParser = require('body-parser'),
    StripeWebhook = require('../../../services/middleware/StripeWebhook');

module.exports.config = function () {

    router.post('/stripe-webhook', bodyParser.raw({ type: 'application/json' }), StripeWebhook.processWebhook)

    return router;
}