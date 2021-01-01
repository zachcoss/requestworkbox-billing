const 
    createSetupIntent = require('./StripeCreateSetupIntent'),
    billingInformation = require('./StripeBillingInformation'),
    updatePaymentMethod = require('./StripeUpdatePaymentMethod'),
    removePaymentMethod = require('./StripeRemovePaymentMethod'),
    createPaymentIntentUpgrade = require('./StripeCreatePaymentIntentUpgrade'),
    createPaymentIntentDataTransfer = require('./StripeCreatePaymentIntentDatatransfer');

module.exports = {
    billingInformation,
    
    updatePaymentMethod,
    removePaymentMethod,

    createSetupIntent,
    createPaymentIntentUpgrade,
    createPaymentIntentDataTransfer,
}