const
    _ = require('lodash'),
    stripe = require('../tools/stripe').Stripe;
    
module.exports = {
    invoicePaymentFailed: async function(event) {
        console.log('Invoice payment failed ', event.id)
    },
    invoicePaymentActionRequired: async function(event) {
        console.log('Invoice payment action required ', event.id)
    },
    customerSubscriptionCreated: async function(event) {
        console.log('Customer subscription created ', event.id)

        const stripeCustomerId = event.data.object.customer
        const subscriptionPlan = event.data.object.items.data[0].plan.nickname

        const findPayload = { stripeCustomerId, active: true, }
    },
    customerSubscriptionDeleted: async function(event) {
        console.log('Customer subscription deleted ', event.id)

        const stripeCustomerId = event.data.object.customer
        const findPayload = { stripeCustomerId, active: true, }
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
                        await module.exports.invoicePaymentFailed(event)
                        break;
                    case 'invoice.payment_action_required':
                        // If the payment requires action
                        await module.exports.invoicePaymentActionRequired(event)
                        break;
                    case 'customer.subscription.created':
                        // when customer subscription is created
                        await module.exports.customerSubscriptionCreated(event)
                        break;
                    case 'customer.subscription.deleted':
                        // when customer subscription is delete
                        await module.exports.customerSubscriptionDeleted(event)
                        break;
                    case 'customer.subscription.updated':
                        // when customer changes plans
                        await module.exports.customerSubscriptionUpdated(event)
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