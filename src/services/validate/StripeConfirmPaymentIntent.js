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
        if (!req.body.paymentIntentId) throw new Error('Missing payment intent id.')
        if (!_.isString(req.body.paymentIntentId)) throw new Error('Incorrect payment intent id type.')

        let payload = {
            sub: req.user.sub,
            paymentIntentId: req.body.paymentIntentId,
        }

        return payload
    },
    authorize: async function(payload) {
        try {
            const 
                requesterSub = payload.sub;
            
            const intent = await IndexSchema.Intent.findOne({
                sub: requesterSub,
                paymentIntentId: payload.paymentIntentId,
            })
            if (!intent || !intent._id) throw new Error('Intent not found.')

            const project = await IndexSchema.Project.findOne({ _id: intent.projectId })
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            // Requires owner permission
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (!member.owner) throw new Error('Permission error.')
            if (member.status === 'removed') throw new Error('Permission error.')
            if (member.status === 'invited') throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission === 'none') throw new Error('Permission error.')
            if (member.permission === 'read') throw new Error('Permission error.')
            if (member.permission !== 'write') throw new Error('Permission error.')
            
            return { intent, project }
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function({ intent, project }) {
        try {

            const billing = await IndexSchema.Billing.findOne({
                sub: intent.sub,
            })

            if (!billing || !billing._id) throw new Error('Billing not found.')
            if (!billing.stripeCustomerId) throw new Error('Billing information not found.')

            const customer = await stripe.customers.retrieve(billing.stripeCustomerId)

            if (!customer || !customer.invoice_settings || !customer.invoice_settings.default_payment_method) throw new Error('Payment not found.')
            const paymentMethod = customer.invoice_settings.default_payment_method

            return { paymentMethod }
        } catch(err) {
            throw new Error(err.message)
        }
    },
    response: function(request, res) {
        let response = _.pickBy(request, function(value, key) {
            return _.includes(['paymentMethod'], key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        console.log('Stripe: confirm payment intent error.', err)
        return res.status(400).send(err.message)
    },
}