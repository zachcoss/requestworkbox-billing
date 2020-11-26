const
    _ = require('lodash'),
    IndexSchema = require('../tools/schema').schema,
    stripe = require('../tools/stripe').Stripe,
    moment = require('moment');

module.exports = {
    getAccountDetails: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, active: true, }

            // Pull Billing
            let billing = await IndexSchema.Billing.findOne(findPayload)

            if (!billing) {
                return res.status(401).send('Could not find billing')
            }
            if (!billing.accountType) {
                return res.status(401).send('Could not find billing account type')
            }

            // Pull Settings
            let setting = await IndexSchema.Setting.findOne(findPayload)

            if (!setting) {
                return res.status(401).send('Could not find setting')
            }

            // Pull Tokens
            let tokens = await IndexSchema.Token.find(findPayload, '-_id snippet')

            // Pull Stripe customer object
            const customer = await stripe.customers.retrieve(billing.stripeCustomerId)

            let card = ''

            if (billing.stripeCardBrand && customer.invoice_settings.default_payment_method) {
                card = `${billing.stripeCardBrand.toUpperCase()} ${billing.stripeCardLast4}`
            }

            const accountDetails = {
                accountType: billing.accountType,
                stripeCustomerId: billing.stripeCustomerId,
                setting,
                balance: customer.balance,
                card: card,
                tokens,
            }

            return res.status(200).send(accountDetails)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}