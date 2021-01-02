const
    ValidateStripe = require('../validate/Stripe');

module.exports = {
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
    createPaymentIntentUpgrade: async (req, res, next) => {
        try {
            const payload = ValidateStripe.createPaymentIntentUpgrade.validate(req)
            const authorize = await ValidateStripe.createPaymentIntentUpgrade.authorize(payload)
            const request = await ValidateStripe.createPaymentIntentUpgrade.request(authorize)
            return ValidateStripe.createPaymentIntentUpgrade.response(request, res)
        } catch (err) {
            return ValidateStripe.createPaymentIntentUpgrade.error(err, res)
        }
    },
    createPaymentIntentDataTransfer: async (req, res, next) => {
        try {
            const payload = ValidateStripe.createPaymentIntentDataTransfer.validate(req)
            const authorize = await ValidateStripe.createPaymentIntentDataTransfer.authorize(payload)
            const request = await ValidateStripe.createPaymentIntentDataTransfer.request(authorize)
            return ValidateStripe.createPaymentIntentDataTransfer.response(request, res)
        } catch (err) {
            return ValidateStripe.createPaymentIntentDataTransfer.error(err, res)
        }
    },
    confirmPaymentIntent: async (req, res, next) => {
        try {
            const payload = ValidateStripe.confirmPaymentIntent.validate(req)
            const authorize = await ValidateStripe.confirmPaymentIntent.authorize(payload)
            const request = await ValidateStripe.confirmPaymentIntent.request(authorize)
            return ValidateStripe.confirmPaymentIntent.response(request, res)
        } catch (err) {
            return ValidateStripe.confirmPaymentIntent.error(err, res)
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
}