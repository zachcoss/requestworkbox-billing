const 
    billingInformation = require('./StripeBillingInformation'),
    createSetupIntent = require('./StripeCreateSetupIntent'),
    createPaymentIntentUpgrade = require('./StripeCreatePaymentIntentUpgrade'),
    createPaymentIntentDataTransfer  = require('./StripeCreatePaymentIntentDatatransfer'),
    updatePaymentMethod = require('./StripeUpdatePaymentMethod'),
    removePaymentMethod = require('./StripeRemovePaymentMethod');

module.exports = {
    billingInformation,

    createSetupIntent,
    createPaymentIntentUpgrade,
    createPaymentIntentDataTransfer,

    updatePaymentMethod,
    removePaymentMethod,
}