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
        if (!req.body.checkoutType) throw new Error('Missing checkout type.')
        if (!_.isString(req.body.checkoutType)) throw new Error('Incorrect checkout type.')

        let payload = {
            sub: req.user.sub,
            checkoutType: req.body.checkoutType,
        }

        if (req.body.coupon) {
            if (!_.isString(req.body.coupon)) throw new Error('Incorrect coupone type.')
            payload.coupon = req.body.coupon
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
            
            let promotionId;

            const billing = await IndexSchema.Billing.findOne({
                sub: payload.sub,
                active: true,
            })
            if (!billing || !billing._id) throw new Error('Billing not found.')
            if (!billing.stripeCustomerId) throw new Error('Billing information not found.')

            const products = await stripe.products.list({ limit: 3 })

            const selectedProduct = _.filter(products.data, (product) => {
                if (product.name === _.upperFirst(payload.checkoutType)) return true
                else return false
            })

            if (!selectedProduct || !selectedProduct[0] || !selectedProduct[0].id) throw new Error('Checkout type not found.')

            const prices = await stripe.prices.list({
                product: selectedProduct[0].id,
                active: true,
            })

            const selectedPrices = _.map(prices.data, (price) => {
                return { price: price.id }
            })

            if (payload.coupon) {
                const promotionCodes = await stripe.promotionCodes.list()
                const promotion = _.filter(promotionCodes.data, (promotion) => {
                    if (_.lowerCase(promotion.code) === _.lowerCase(payload.coupon)) return true
                    else return false
                })

                if (!promotion || !promotion[0] || !promotion[0].id) throw new Error('Promotion not found.')

                promotionId = promotion[0].id
            }

            let subscriptionObject = {
                customer: billing.stripeCustomerId,
                items: selectedPrices,
            }

            if (promotionId) subscriptionObject.promotion_code = promotionId

            await stripe.subscriptions.create(subscriptionObject)

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
            console.log('Create subscription error', err)
            return res.status(500).send('Request error')
        }
    },
}