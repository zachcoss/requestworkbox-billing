const 
    express = require('express'),
    router = express.Router(),
    Signup = require('../../../services/middleware/Signup'),
    Stripe = require('../../../services/middleware/Stripe'),
    Token = require('../../../services/middleware/Token');

module.exports.config = function () {

    router.post('/create-customer', Signup.createCustomer)
    router.post('/update-customer', Signup.updateCustomer)
    
    router.post('/list-tokens', Token.listTokens)
    router.post('/generate-token', Token.generateToken)
    router.post('/revoke-token', Token.revokeToken)
    
    router.post('/billing-information', Stripe.billingInformation)
    router.post('/create-setup-intent', Stripe.createSetupIntent)
    router.post('/create-payment-intent-upgrade', Stripe.createPaymentIntentUpgrade)
    router.post('/create-payment-intent-datatransfer', Stripe.createPaymentIntentDatatransfer)

    router.post('/update-payment-method', Stripe.updatePaymentMethod)
    router.post('/remove-payment-method', Stripe.removePaymentMethod)

    return router;
}