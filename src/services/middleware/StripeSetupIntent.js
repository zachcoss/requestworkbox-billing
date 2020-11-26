const
    _ = require('lodash'),
    IndexSchema = require('../tools/schema').schema,
    stripe = require('../tools/stripe').Stripe;

module.exports = {
    createSetupIntent: async function (req, res, next) {
        try {
            if (!req.body.stripeCustomerId) {
                return res.status(400).send('Please include customer id')
            }

            const intent =  await stripe.setupIntents.create({
                customer: req.body.stripeCustomerId,
            });

            return res.status(200).send({ clientSecret: intent.client_secret })
        } catch (err) {
            console.log(err)
            return res.status(500).send('error intercepting webhook')
        }
    },
    updatePaymentMethod: async function (req, res, next) {
        try {
            if (!req.body.stripeCustomerId) {
                return res.status(400).send('Please include customer id')
            }
            if (!req.body.paymentMethodId) {
                return res.status(400).send('Please include payment id')
            }

            const paymentMethodId = req.body.paymentMethodId

            const customer = await stripe.customers.update(req.body.stripeCustomerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId
                }
            })

            const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

            const account = await IndexSchema.Billing.findOne({sub: req.user.sub})

            account.stripeCardBrand = paymentMethod.card.brand
            account.stripeCardMonth = paymentMethod.card.exp_month
            account.stripeCardYear = paymentMethod.card.exp_year
            account.stripeCardLast4 = paymentMethod.card.last4
            
            await account.save()

            return res.status(200).send('OK')
        } catch (err) {
            console.log(err)
            return res.status(500).send('error intercepting webhook')
        }
    },
}