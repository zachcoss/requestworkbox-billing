const 
    createSetupIntent = require('./StripeCreateSetupIntent'),
    billingInformation = require('./StripeBillingInformation'),
    updatePaymentMethod = require('./StripeUpdatePaymentMethod'),
    removePaymentMethod = require('./StripeRemovePaymentMethod'),
    createSubscription = require('./StripeCreateSubscription'),
    cancelSubscription = require('./StripeCancelSubscription'),
    previewCheckoutPrice = require('./StripePreviewCheckoutPrice');

module.exports = {
    createSetupIntent: createSetupIntent,
    billingInformation: billingInformation,
    
    updatePaymentMethod: updatePaymentMethod,
    removePaymentMethod: removePaymentMethod,

    createSubscription: createSubscription,
    cancelSubscription: cancelSubscription,
    previewCheckoutPrice: previewCheckoutPrice,
}