const { Stripe } = require('../tools/stripe');

const
    _ = require('lodash'),
    IndexSchema = require('../tools/schema').schema,
    stripe = require('../tools/stripe').Stripe;

module.exports = {
    createSubscription: async function (req, res, next) {
        try {
            const findPayload = { sub: req.user.sub }
            let billing = await IndexSchema.Billing.findOne(findPayload)

            if (!billing) {
                return res.status(401).send('Could not find billing')
            }

            if (!req.body.checkoutType) {
                return res.status(400).send('Please include checkout type')
            }

            const stripeCustomerId = billing.stripeCustomerId

            const upgradeTo = req.body.checkoutType
            const coupon = req.body.coupon

            const products = await stripe.products.list({
                limit: 3,
            })

            const selectedProduct = _.filter(products.data, (product) => {
                if (product.name === _.upperFirst(upgradeTo)) return true
                else return false
            })[0]

            const prices = await stripe.prices.list({
                product: selectedProduct.id
            })

            const selectedPrices = _.map(prices.data, (price) => {
                return {
                    price: price.id
                }
            })

            let promoId = ''

            if (req.body.coupon) {
                const promotionCodes = await stripe.promotionCodes.list()

                const promotion = _.filter(promotionCodes.data, (promotion) => {
                    if (_.lowerCase(promotion.code) === _.lowerCase(req.body.coupon)) return true
                    else return false
                })[0]

                if (promotion.id) promoId = promotion.id
            }

            let subscriptionObject = {
                customer: stripeCustomerId,
                items: selectedPrices,
            }

            if (promoId !== '') {
                subscriptionObject.promotion_code = promoId
            }

            const subscription = await stripe.subscriptions.create(subscriptionObject)

            billing.accountType = upgradeTo
            await billing.save()

            return res.status(200).send('OK')
        } catch (err) {
            console.log(err)
            return res.status(500).send('error intercepting webhook')
        }
    },
}