const 
    express = require('express'),
    router = express.Router(),
    bodyParser = require('body-parser'),
    indexMiddleware = require('../../../services/middleware/indexMiddleware'),
    SignupMiddleware = require('../../../services/middleware/Signup'),
    BillingMiddleware = require('../../../services/middleware/Billing'),
    StripeWebhook = require('../../../services/middleware/StripeWebhook');

module.exports.config = function () {

    router.get('/', indexMiddleware.healthcheck)
    router.all('*', indexMiddleware.interceptor)

    router.post('/create-customer', SignupMiddleware.createCustomer)
    router.post('/update-customer', SignupMiddleware.updateCustomer)

    router.post('/get-account-type', BillingMiddleware.getAccountType)
    router.post('/update-account-type', BillingMiddleware.updateAccountType)

    return router;
}