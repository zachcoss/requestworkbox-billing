const
    _ = require('lodash'),
    IndexSchema = require('../tools/schema').schema,
    stripe = require('../tools/stripe').Stripe;

module.exports = {
    createSetupIntent: async function (req, res, next) {
        try {
            const findPayload = { sub: req.user.sub }
            let billing = await IndexSchema.Billing.findOne(findPayload)

            if (!billing) {
                return res.status(401).send('Could not find billing')
            }

            const stripeCustomerId = billing.stripeCustomerId

            const intent =  await stripe.setupIntents.create({
                customer: stripeCustomerId,
            })

            return res.status(200).send({ clientSecret: intent.client_secret })
        } catch (err) {
            console.log(err)
            return res.status(500).send('error intercepting webhook')
        }
    },
    updatePaymentMethod: async function (req, res, next) {
        try {
            if (!req.body.paymentMethodId) {
                return res.status(400).send('Please include payment id')
            }

            const findPayload = { sub: req.user.sub }
            let billing = await IndexSchema.Billing.findOne(findPayload)

            if (!billing) {
                return res.status(401).send('Could not find billing')
            }

            const stripeCustomerId = billing.stripeCustomerId
            const paymentMethodId = req.body.paymentMethodId
            

            const customer = await stripe.customers.update(stripeCustomerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId
                }
            })

            const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

            billing.stripeCardBrand = paymentMethod.card.brand
            billing.stripeCardMonth = paymentMethod.card.exp_month
            billing.stripeCardYear = paymentMethod.card.exp_year
            billing.stripeCardLast4 = paymentMethod.card.last4
            
            await billing.save()

            return res.status(200).send('OK')
        } catch (err) {
            console.log(err)
            return res.status(500).send('error intercepting webhook')
        }
    },
    removePaymentMethod: async function (req, res, next) {
        try {
            const findPayload = { sub: req.user.sub }
            let billing = await IndexSchema.Billing.findOne(findPayload)

            if (!billing) {
                return res.status(401).send('Could not find billing')
            }

            const stripeCustomerId = billing.stripeCustomerId

            const customer = await stripe.customers.retrieve(stripeCustomerId)
            const paymentMethodId = customer.invoice_settings.default_payment_method

            await stripe.customers.update(customer.id, {
                invoice_settings: {
                    default_payment_method: null,
                }
            })

            await stripe.paymentMethods.detach(paymentMethodId)

            return res.status(200).send('OK')
        } catch (err) {
            console.log(err)
            return res.status(500).send('error intercepting webhook')
        }
    },
}