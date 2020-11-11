const 
    express = require('express'),
    router = express.Router(),
    indexMiddleware = require('../../../services/middleware/indexMiddleware'),
    stripeWebhook = require('../../../services/middleware/stripeWebhook');

module.exports.config = function () {

    router.get('/', indexMiddleware.healthcheck)
    router.all('*', indexMiddleware.interceptor)

    router.post('/stripe-webhook', stripeWebhook.processWebhook)

    return router;
}