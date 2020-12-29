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

            const intent =  await stripe.setupIntents.create({
                customer: billing.stripeCustomerId,
            })

            return { clientSecret: intent.client_secret }
        } catch(err) {
            throw new Error(err.message)
        }
    },
    response: function(request, res) {
        let response = _.pickBy(request, function(value, key) {
            return _.includes(['clientSecret'], key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        console.log('Stripe: create setup intent error.', err)
        return res.status(400).send(err.message)
    },
}