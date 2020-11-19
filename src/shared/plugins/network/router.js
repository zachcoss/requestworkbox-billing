const 
    express = require('express'),
    router = express.Router(),
    bodyParser = require('body-parser'),
    indexMiddleware = require('../../../services/middleware/indexMiddleware'),
    SignupMiddleware = require('../../../services/middleware/Signup'),
    AccountMiddleware = require('../../../services/middleware/Account'),
    BillingMiddleware = require('../../../services/middleware/Billing'),
    SettingMiddleware = require('../../../services/middleware/Setting'),
    StripeWebhook = require('../../../services/middleware/StripeWebhook');

module.exports.config = function () {

    router.get('/', indexMiddleware.healthcheck)
    router.all('*', indexMiddleware.interceptor)

    router.post('/create-customer', SignupMiddleware.createCustomer)
    router.post('/update-customer', SignupMiddleware.updateCustomer)

    router.post('/get-account-details', AccountMiddleware.getAccountDetails)
    
    router.post('/update-global-workflow-status', SettingMiddleware.updateGlobalWorkflowStatus)
    router.post('/update-email-alert', SettingMiddleware.updateEmailAlert)

    router.post('/update-account-type', BillingMiddleware.updateAccountType)

    return router;
}