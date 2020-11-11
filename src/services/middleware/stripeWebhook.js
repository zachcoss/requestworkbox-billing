const
    _ = require('lodash'),
    stripe = require('../tools/stripe').Stripe;

module.exports = {
    customerCreated: async function(event) {
        console.log('Customer created event', event)
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
                    case 'customer.created':
                        // Used to provision services after the trial has ended.
                        // The status of the invoice will show up as paid. Store the status in your
                        // database to reference when a user accesses your service to avoid hitting rate limits.
                        module.exports.customerCreated(event)
                        break;
                    case 'invoice.paid':
                        // Used to provision services after the trial has ended.
                        // The status of the invoice will show up as paid. Store the status in your
                        // database to reference when a user accesses your service to avoid hitting rate limits.
                        break;
                    case 'invoice.payment_failed':
                        // If the payment fails or the customer does not have a valid payment method,
                        //  an invoice.payment_failed event is sent, the subscription becomes past_due.
                        // Use this webhook to notify your user that their payment has
                        // failed and to retrieve new card details.
                        break;
                    case 'customer.subscription.deleted':
                        if (event.request != null) {
                        // handle a subscription cancelled by your request
                        // from above.
                        } else {
                        // handle subscription cancelled automatically based
                        // upon your subscription settings.
                        }
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