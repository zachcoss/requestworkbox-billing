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

            const accountDetails = {
                accountType: billing.accountType,
                setting,
                balance: customer.balance,
                card: customer.default_source,
                tokens,
            }

            return res.status(200).send(accountDetails)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}