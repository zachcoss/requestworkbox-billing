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
    stripe = require('../tools/stripe').Stripe,
    // includes client_secret
    intentKeys = ['_id','active','status','projectId','intentType','product','price','paymentIntentId','coupon','client_secret','createdAt','updatedAt'],
    productKeys = ['standard','developer','professional'],
    coupons = ['PRODUCTHUNT'],
    pricing = {
        // production: { standard: 1000, developer: 2500, professional: 5000, },
        production: { standard: 50, developer: 75, professional: 100, },
        development: { standard: 50, developer: 75, professional: 100, },
    };

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.projectId) throw new Error('Missing project id.')
        if (!req.body.product) throw new Error('Missing product type.')

        if (!_.isString(req.body.projectId)) throw new Error('Incorrect project id type.')
        if (!_.includes(productKeys, req.body.product)) throw new Error('Incorrect product type.')

        let payload = {
            sub: req.user.sub,
            projectId: req.body.projectId,
            product: req.body.product,
        }

        if (req.body.coupon && !_.isString(req.body.coupon)) throw new Error('Incorrect coupon type.')
        payload.coupon = req.body.coupon

        return payload
    },
    authorize: async function(payload) {
        try {
            const 
                requesterSub = payload.sub;

            const project = await IndexSchema.Project.findOne({ _id: payload.projectId })
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
            
            return { payload, project }
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function({ payload, project }) {
        try {

            if (payload.product === 'standard' && !_.includes(['free'], project.projectType)) throw new Error('Purchase not supported.')
            if (payload.product === 'developer' && !_.includes(['free','standard'], project.projectType)) throw new Error('Purchase not supported.')
            if (payload.product === 'professional' && !_.includes(['free','standard','developer'], project.projectType)) throw new Error('Purchase not supported.')

            const 
                price = pricing[process.env.NODE_ENV][payload.product],
                intentType = 'upgrade';

            const billing = await IndexSchema.Billing.findOne({
                sub: payload.sub,
                active: true,
            })
            if (!billing || !billing._id) throw new Error('Billing not found.')
            if (!billing.stripeCustomerId) throw new Error('Billing information not found.')

            let intent = await IndexSchema.Intent.findOne({
                sub: billing.sub,
                projectId: project._id,
                intentType: intentType,
                product: payload.product,
            })

            if (!intent || !intent._id) {
                intent = new IndexSchema.Intent({
                    sub: billing.sub,
                    projectId: project._id,
                    intentType: intentType,
                    product: payload.product,
                    price: price,
                })
            } else {
                if (intent.status === 'completed') throw new Error('Payment completed.')
                if (intent.status !== 'started') throw new Error('Incorrect payment status.')
            }

            if (payload.coupon) {
                if (!_.includes(coupons, payload.coupon)) throw new Error('Coupon not found.')
                if (intent.product !== 'standard') throw new Error('Coupon only supports standard upgrade.')

                const couponsRedeemed = await IndexSchema.Intent.countDocuments({
                    sub: billing.sub,
                    status: 'completed',
                    intentType: intentType,
                    coupon: coupons[0],
                })

                if (couponsRedeemed > 0) throw new Error('Coupon has already been redeemed.')

                if (intent.paymentIntentId && _.isString(intent.paymentIntentId) && intent.paymentIntentId !== '') {
                    await stripe.paymentIntents.cancel(intent.paymentIntentId, {
                        cancellation_reason: 'abandoned',
                    })
                }
                
                intent.status = 'completed'
                intent.price = 0
                intent.coupon = payload.coupon
                await intent.save()
                
                project.projectType = 'standard'
                await project.save()
                
                return intent
            }

            let paymentIntent;

            if (!intent.paymentIntentId) {
                paymentIntent = await stripe.paymentIntents.create({
                    amount: price,
                    currency: 'usd',
                    payment_method_types: ['card'],
                    customer: billing.stripeCustomerId,
                    metadata: { intentId: intent._id.toString() },
                })

                intent.paymentIntentId = paymentIntent.id
            } else {
                paymentIntent = await stripe.paymentIntents.retrieve(intent.paymentIntentId)
            }

            await intent.save()

            const client_secret = paymentIntent.client_secret

            return { intent, client_secret }
        } catch(err) {
            throw new Error(err.message)
        }
    },
    response: function(payload, res) {
        let finalIntent;

        if (payload._id) {
            finalIntent = payload.toJSON()
        } else if (payload.client_secret) {
            finalIntent = payload.intent.toJSON()
            finalIntent.client_secret = payload.client_secret
        }

        let response = _.pickBy(finalIntent, function(value, key) {
            return _.includes(intentKeys, key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        console.log('Stripe: create payment intent upgrade error.', err)
        return res.status(400).send(err.message)
    },
}