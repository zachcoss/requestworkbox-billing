const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        },
        isAlphanumeric: function(string) {
            return /^[a-zA-Z0-9_]*$/.test(string)
        },
    }),
    IndexSchema = require('../tools/schema').schema,
    stripe = require('../tools/stripe').Stripe;

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        
        let payload = {
            sub: req.user.sub,
        }

        return payload
    },
    authorize: async function(payload) {
        try {
            return payload
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function(payload) {
        try {

            const billing = await IndexSchema.Billing.findOne({
                sub: payload.sub,
                active: true,
            })
            if (!billing || !billing._id) throw new Error('Billing not found.')
            if (!billing.stripeCustomerId) throw new Error('Billing information not found.')

            const customer = await stripe.customers.retrieve(billing.stripeCustomerId)

            let accountDetails = {
                stripeCustomerId: billing.stripeCustomerId,
                balance: customer.balance,
            }

            if (billing.stripeCardBrand && billing.stripeCardLast4 && customer.invoice_settings.default_payment_method) {
                accountDetails.card = `${billing.stripeCardBrand.toUpperCase()} ${billing.stripeCardLast4}`
            }

            return accountDetails
        } catch(err) {
            throw new Error(err.message)
        }
    },
    response: function(request, res) {
        let response = _.pickBy(request, function(value, key) {
            return _.includes(['stripeCustomerId','balance','card'], key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        console.log('Stripe: billing information error.', err)
        return res.status(400).send(err.message)
    },
}