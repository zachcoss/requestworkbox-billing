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
    IndexSchema = require('../tools/schema').schema;

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.paymentMethodId) throw new Error('Missing payment method id.')
        if (!_.isString(req.body.paymentMethodId)) throw new Error('Incorrect payment method id type.')
        
        let payload = {
            sub: req.user.sub,
            paymentMethodId: req.body.paymentMethodId,
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

            await stripe.customers.update(billing.stripeCustomerId, {
                invoice_settings: { default_payment_method: payload.paymentMethodId }
            })

            const paymentMethod = await stripe.paymentMethods.retrieve(payload.paymentMethodId)

            billing.stripeCardBrand = paymentMethod.card.brand
            billing.stripeCardMonth = paymentMethod.card.exp_month
            billing.stripeCardYear = paymentMethod.card.exp_year
            billing.stripeCardLast4 = paymentMethod.card.last4
            
            await billing.save()

            return 'OK'
        } catch(err) {
            throw new Error(err.message)
        }
    },
    response: function(request, res) {
        return res.status(200).send(request)
    },
    error: function(err, res) {
        console.log('Stripe: update payment method error.', err)
        return res.status(400).send(err.message)
    },
}