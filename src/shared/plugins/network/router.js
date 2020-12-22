const 
    express = require('express'),
    router = express.Router(),
    indexMiddleware = require('../../../services/middleware/indexMiddleware'),
    SignupMiddleware = require('../../../services/middleware/Signup'),
    AccountMiddleware = require('../../../services/middleware/Account'),
    SettingMiddleware = require('../../../services/middleware/Setting'),
    StripeSetupIntent = require('../../../services/middleware/StripeSetupIntent'),
    StripeSubscription = require('../../../services/middleware/StripeSubscription');

module.exports.config = function () {

    router.get('/', indexMiddleware.healthcheck)
    router.all('*', indexMiddleware.validateOrigin)
    router.all('*', indexMiddleware.interceptor)

    router.post('/create-customer', SignupMiddleware.createCustomer)
    router.post('/update-customer', SignupMiddleware.updateCustomer)

    router.post('/get-account-details', AccountMiddleware.getAccountDetails)
    router.post('/preview-checkout-price', AccountMiddleware.previewCheckoutPrice)
    
    router.post('/generate-token', SettingMiddleware.generateToken)
    router.post('/revoke-token', SettingMiddleware.revokeToken)

    router.post('/create-setup-intent', StripeSetupIntent.createSetupIntent)
    router.post('/update-payment-method', StripeSetupIntent.updatePaymentMethod)
    router.post('/remove-payment-method', StripeSetupIntent.removePaymentMethod)

    router.post('/create-subscription', StripeSubscription.createSubscription)
    router.post('/cancel-subscription', StripeSubscription.cancelSubscription)

    return router;
}