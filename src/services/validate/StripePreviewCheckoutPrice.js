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

            if (!selectedProduct || !selectedProduct[0] || !selectedProduct[0].id) throw new Error('Product not found.')

            const prices = await stripe.prices.list({
                product: selectedProduct[0].id,
                active: true,
            })

            const selectedPrices = _.map(prices.data, function(price) {
                return {
                    price: price.unit_amount,
                    name: price.nickname,
                }
            })

            const finalPrice = _.filter(selectedPrices, (product) => {
                if (product.name === `${payload.checkoutType}_monthly`) return true
                else return false
            })

            if (!finalPrice || !finalPrice[0] || !finalPrice[0].price) throw new Error('Price not found.')

            let price = finalPrice[0].price

            const checkoutTotals = {
                checkoutPrice: price,
                checkoutDiscount: 0,
                checkoutTotal: price,
            }

            if (payload.coupon) {
                const promotionCodes = await stripe.promotionCodes.list()
                const promotion = _.filter(promotionCodes.data, (promotion) => {
                    if (_.lowerCase(promotion.code) === _.lowerCase(payload.coupon)) return true
                    else return false
                })

                if (!promotion || !promotion[0] || !promotion[0].id) throw new Error('Promotion not found.')
                if (!promotion[0].coupon || !promotion[0].coupon.percent_off) throw new Error('Promotion coupon not found.')

                const
                    percentOff = promotion[0].coupon.percent_off / 100,
                    reduction = checkoutTotals.checkoutPrice * percentOff;

                checkoutTotals.checkoutDiscount = reduction
                checkoutTotals.checkoutTotal = checkoutTotals.checkoutPrice - checkoutTotals.checkoutDiscount
            }

            return checkoutTotals
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
            console.log('Preview checkout price error', err)
            return res.status(500).send('Request error')
        }
    },
}