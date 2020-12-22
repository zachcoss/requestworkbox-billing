const
    _ = require('lodash'),
    IndexSchema = require('../tools/schema').schema,
    stripe = require('../tools/stripe').Stripe,
    moment = require('moment');

module.exports = {
    getAccountDetails: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, active: true, }

            const billing = await IndexSchema.Billing.findOne(findPayload)
            if (!billing) return res.status(401).send('Could not find billing')

            const setting = await IndexSchema.Setting.findOne(findPayload)
            if (!setting) return res.status(401).send('Could not find setting')

            const tokens = await IndexSchema.Token.find(findPayload, '-_id snippet')

            let accountDetails = {
                setting,
                tokens,
            };

            if (billing.stripeCustomerId) {
                accountDetails.stripeCustomerId = billing.stripeCustomerId

                const customer = await stripe.customers.retrieve(billing.stripeCustomerId)

                if (billing.stripeCardBrand && billing.stripeCardLast4 && customer.invoice_settings.default_payment_method) {
                    card = `${billing.stripeCardBrand.toUpperCase()} ${billing.stripeCardLast4}`
                    if (card) accountDetails.card = card
                }

                if (customer.balance) accountDetails.balance = customer.balance
            }

            return res.status(200).send(accountDetails)
        } catch (err) {
            console.log('Get account details error', err)
            return res.status(500).send('Get account details error')
        }
    },
    previewCheckoutPrice: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, active: true, }

            if (!req.body.checkoutType) return res.status(400).send('Please include checkout type')

            let billing = await IndexSchema.Billing.findOne(findPayload)

            if (!billing) {
                return res.status(401).send('Could not find billing')
            }
            if (!billing.accountType) {
                return res.status(401).send('Could not find billing account type')
            }

            const upgradeTo = req.body.checkoutType

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

            const selectedPrices = _.map(prices.data, function(price) {
                return {
                    price: price.unit_amount,
                    name: price.nickname,
                }
            })

            const finalPrice = _.filter(selectedPrices, (product) => {
                if (product.name === `${upgradeTo}_monthly`) return true
                else return false
            })[0]

            const checkoutTotals = {
                checkoutPrice: 0,
                checkoutDiscount: 0,
                checkoutTotal: 0,
            }

            if (billing.accountType === 'free') {
                checkoutTotals.checkoutPrice = finalPrice.price
                checkoutTotals.checkoutTotal = finalPrice.price
            }

            if (req.body.coupon) {
                const promotionCodes = await stripe.promotionCodes.list()

                const promotion = _.filter(promotionCodes.data, (promotion) => {
                    if (_.lowerCase(promotion.code) === _.lowerCase(req.body.coupon)) return true
                    else return false
                })[0]

                if (promotion.id && promotion.coupon && promotion.coupon.percent_off) {
                    const percentOff = promotion.coupon.percent_off / 100
                    const reduction = checkoutTotals.checkoutPrice * percentOff

                    checkoutTotals.checkoutDiscount = reduction
                    checkoutTotals.checkoutTotal = checkoutTotals.checkoutPrice - checkoutTotals.checkoutDiscount
                }
            }

            return res.status(200).send(checkoutTotals)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}