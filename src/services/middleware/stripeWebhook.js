const
    _ = require('lodash'),
    stripe = require('../tools/stripe').Stripe,
    moment = require('moment'),
    IndexSchema = require('../tools/schema').schema;

module.exports = {
    invoicePaymentFailed: async function(event) {
        // only non action required events should
        // cause changes here
        console.log('Invoice payment failed ', event.id)
        // Notify user
        // Update accountType to Free
        // When user is on the billing page, they should: 
        // - Update payment method
        // - Pay the existing invoice
        // - Update accountType back to last accountType
    },
    invoicePaymentActionRequired: async function(event) {
        console.log('Invoice payment action required ', event.id)
        // Notify user
        // Update accountType to Free
        // When user is on the billing page, they should: 
        // - Update payment method
        // - Pass secret to confirmCardPayment
        // - Update accountType back to last accountType
    },
    customerSubscriptionCreated: async function(event) {
        const stripeCustomerId = event.data.object.customer

        const findPayload = { stripeCustomerId, active: true, }

        // Pull Billing
        let billing = await IndexSchema.Billing.findOne(findPayload)

        if (!billing) {
            return res.status(500).send('Could not find billing')
        }
        if (!billing.accountType) {
            return res.status(500).send('Could not find billing account type')
        }

        let subscriptionType = ''

        const subscriptionPlan = event.data.object.items.data[0].plan.nickname

        if (_.includes(subscriptionPlan, '_monthly')) {
            subscriptionType = subscriptionPlan.replace('_monthly', '')
        } else if (_.includes(subscriptionPlan, '_metered')) {
            subscriptionType = subscriptionPlan.replace('_metered', '')
        }

        billing.accountType = subscriptionType
        billing.stripeCurrentPeriodStart = moment(event.data.object.current_period_start * 1000).toDate()
        billing.stripeCurrentPeriodEnd = moment(event.data.object.current_period_end * 1000).toDate()
        billing.stripeSubscriptionId = event.data.object.id
        await billing.save()
    },
    customerSubscriptionDeleted: async function(event) {
        const stripeCustomerId = event.data.object.customer

        const findPayload = { stripeCustomerId, active: true, }

        // Pull Billing
        let billing = await IndexSchema.Billing.findOne(findPayload)

        if (!billing) {
            return res.status(500).send('Could not find billing')
        }
        if (!billing.accountType) {
            return res.status(500).send('Could not find billing account type')
        }

        billing.accountType = 'free'
        billing.stripeCurrentPeriodStart = undefined
        billing.stripeCurrentPeriodEnd = undefined
        billing.stripeSubscriptionId = undefined
        await billing.save()
    },
    customerSubscriptionUpdated: async function(event) {
        console.log('Customer subscription updated ', event.id)
    },
    processWebhook: async function (req, res, next) {
        try {

            let event

            try {
                event = stripe.webhooks.constructEvent(req.body,req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET)

                // Extract the object from the event.
                const dataObject = event.data.object

                // Handle the event
                // Review important events for Billing webhooks
                // https://stripe.com/docs/billing/webhooks
                // Remove comment to see the various objects sent for this sample
                switch (event.type) {
                    case 'invoice.payment_failed':
                        // If the payment fails or the customer does not have a valid payment method,
                        //  an invoice.payment_failed event is sent, the subscription becomes past_due.
                        // Use this webhook to notify your user that their payment has
                        // failed and to retrieve new card details.
                        module.exports.invoicePaymentFailed(event)
                        break;
                    case 'invoice.payment_action_required':
                        // If the payment requires action
                        module.exports.invoicePaymentActionRequired(event)
                        break;
                    case 'customer.subscription.created':
                        // when customer subscription is created
                        module.exports.customerSubscriptionCreated(event)
                        break;
                    case 'customer.subscription.deleted':
                        // when customer subscription is delete
                        module.exports.customerSubscriptionDeleted(event)
                        break;
                    case 'customer.subscription.updated':
                        // when customer changes plans
                        module.exports.customerSubscriptionUpdated(event)
                        break;
                    default:
                    // Unexpected event type
                }

                return res.sendStatus(200)

            } catch (err) {
                console.log(err)
                console.log('Webhook signature verification failed')
                return res.sendStatus(400)
            }
        } catch (err) {
            console.log(err)
            return res.status(500).send('error intercepting webhook')
        }
    },
}