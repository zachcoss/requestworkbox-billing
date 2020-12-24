const 
    express = require('express'),
    router = express.Router(),
    Signup = require('../../../services/middleware/Signup'),
    Token = require('../../../services/middleware/Token'),
    SettingMiddleware = require('../../../services/middleware/Setting'),
    StripeSetupIntent = require('../../../services/middleware/StripeSetupIntent'),
    StripeSubscription = require('../../../services/middleware/StripeSubscription');

module.exports.config = function () {

    router.post('/create-customer', Signup.createCustomer)
    router.post('/update-customer', Signup.updateCustomer)

    router.post('/get-account-details', AccountMiddleware.getAccountDetails)
    router.post('/preview-checkout-price', AccountMiddleware.previewCheckoutPrice)
    
    router.post('/list-tokens', Token.listTokens)
    router.post('/generate-token', Token.generateToken)
    router.post('/revoke-token', Token.revokeToken)

    router.post('/create-setup-intent', StripeSetupIntent.createSetupIntent)
    router.post('/update-payment-method', StripeSetupIntent.updatePaymentMethod)
    router.post('/remove-payment-method', StripeSetupIntent.removePaymentMethod)

    router.post('/create-subscription', StripeSubscription.createSubscription)
    router.post('/cancel-subscription', StripeSubscription.cancelSubscription)

    return router;
}