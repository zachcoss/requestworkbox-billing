const 
    billingInformation = require('./StripeBillingInformation'),
    createSetupIntent = require('./StripeCreateSetupIntent'),
    createPaymentIntentUpgrade = require('./StripeCreatePaymentIntentUpgrade'),
    createPaymentIntentDataTransfer  = require('./StripeCreatePaymentIntentDataTransfer'),
    confirmPaymentIntent  = require('./StripeConfirmPaymentIntent'),
    updatePaymentMethod = require('./StripeUpdatePaymentMethod'),
    removePaymentMethod = require('./StripeRemovePaymentMethod');

module.exports = {
    billingInformation,

    createSetupIntent,
    createPaymentIntentUpgrade,
    createPaymentIntentDataTransfer,
    confirmPaymentIntent,

    updatePaymentMethod,
    removePaymentMethod,
}