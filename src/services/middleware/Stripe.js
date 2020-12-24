const
    ValidateStripe = require('../validate/Stripe');

module.exports = {
    createSetupIntent: async (req, res, next) => {
        try {
            const payload = ValidateStripe.createSetupIntent.validate(req)
            const authorize = await ValidateStripe.createSetupIntent.authorize(payload)
            const request = await ValidateStripe.createSetupIntent.request(authorize)
            return ValidateStripe.createSetupIntent.response(request, res)
        } catch (err) {
            return ValidateStripe.createSetupIntent.error(err, res)
        }
    },
    billingInformation: async (req, res, next) => {
        try {
            const payload = ValidateStripe.billingInformation.validate(req)
            const authorize = await ValidateStripe.billingInformation.authorize(payload)
            const request = await ValidateStripe.billingInformation.request(authorize)
            return ValidateStripe.billingInformation.response(request, res)
        } catch (err) {
            return ValidateStripe.billingInformation.error(err, res)
        }
    },
    updatePaymentMethod: async (req, res, next) => {
        try {
            const payload = ValidateStripe.updatePaymentMethod.validate(req)
            const authorize = await ValidateStripe.updatePaymentMethod.authorize(payload)
            const request = await ValidateStripe.updatePaymentMethod.request(authorize)
            return ValidateStripe.updatePaymentMethod.response(request, res)
        } catch (err) {
            return ValidateStripe.updatePaymentMethod.error(err, res)
        }
    },
    removePaymentMethod: async (req, res, next) => {
        try {
            const payload = ValidateStripe.removePaymentMethod.validate(req)
            const authorize = await ValidateStripe.removePaymentMethod.authorize(payload)
            const request = await ValidateStripe.removePaymentMethod.request(authorize)
            return ValidateStripe.removePaymentMethod.response(request, res)
        } catch (err) {
            return ValidateStripe.removePaymentMethod.error(err, res)
        }
    },
    createSubscription: async (req, res, next) => {
        try {
            const payload = ValidateStripe.createSubscription.validate(req)
            const authorize = await ValidateStripe.createSubscription.authorize(payload)
            const request = await ValidateStripe.createSubscription.request(authorize)
            return ValidateStripe.createSubscription.response(request, res)
        } catch (err) {
            return ValidateStripe.createSubscription.error(err, res)
        }
    },
    cancelSubscription: async (req, res, next) => {
        try {
            const payload = ValidateStripe.cancelSubscription.validate(req)
            const authorize = await ValidateStripe.cancelSubscription.authorize(payload)
            const request = await ValidateStripe.cancelSubscription.request(authorize)
            return ValidateStripe.cancelSubscription.response(request, res)
        } catch (err) {
            return ValidateStripe.cancelSubscription.error(err, res)
        }
    },
    previewCheckoutPrice: async (req, res, next) => {
        try {
            const payload = ValidateStripe.previewCheckoutPrice.validate(req)
            const authorize = await ValidateStripe.previewCheckoutPrice.authorize(payload)
            const request = await ValidateStripe.previewCheckoutPrice.request(authorize)
            return ValidateStripe.previewCheckoutPrice.response(request, res)
        } catch (err) {
            return ValidateStripe.previewCheckoutPrice.error(err, res)
        }
    },
}