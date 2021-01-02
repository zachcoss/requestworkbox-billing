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
    intentKeys = ['_id','active','status','projectId','intentType','product','price','paymentIntentId','coupone','createdAt','updatedAt'],
    productKeys = ['gb'],
    coupons = ['RQSTWRKBX'],
    pricing = {
        // production: { 'gb': 300, },
        production: { 'gb': 50, },
        development: { 'gb': 50, },
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

            const 
                price = pricing[process.env.NODE_ENV][payload.product],
                intentType = 'datatransfer';

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
            }

            if (payload.coupon) {
                if (!_.includes(coupons, payload.coupon)) throw new Error('Coupon not found.')
                if (intent.product !== 'gb') throw new Error('Coupon only supports 1 gb upgrade.')

                const couponsRedeemed = await IndexSchema.Intent.countDocuments({
                    sub: billing.sub,
                    status: 'completed',
                    intentType: intentType,
                    coupon: { $nin: ['']},
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
                
                project.usageTotal = project.usageTotal + 1000
                await project.save()
                
                return intent
            }

            if (!intent.paymentIntentId) {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: price,
                    currency: 'usd',
                    payment_method_types: ['card'],
                    customer: billing.stripeCustomerId,
                    metadata: { intentId: intent._id.toString() },
                })

                intent.paymentIntentId = paymentIntent.id
            }

            await intent.save()

            return intent.toJSON()
        } catch(err) {
            throw new Error(err.message)
        }
    },
    response: function(request, res) {
        let response = _.pickBy(request, function(value, key) {
            return _.includes(intentKeys, key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        console.log('Stripe: create payment intent data transfer error.', err)
        return res.status(400).send(err.message)
    },
}