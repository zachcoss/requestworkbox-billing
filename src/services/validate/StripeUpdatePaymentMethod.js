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
            throw new Error(err)
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
            throw new Error(err)
        }
    },
    response: function(request, res) {
        let response = _.pickBy(request, function(value, key) {
            return _.includes(keys.concat(permissionKeys), key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Error: Settings not found.') return res.status(401).send('Invalid or missing token.')
        else if (err.message === 'Error: Project not found.') return res.status(400).send('Project not found.')
        else {
            console.log('Update payment method error', err)
            return res.status(500).send('Request error')
        }
    },
}