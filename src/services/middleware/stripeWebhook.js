const
    _ = require('lodash'),
    IndexSchema = require('../tools/schema').schema;
    stripe = require('../tools/stripe').Stripe;
    
module.exports = {
    paymentIntentSucceeded: async function(event) {
        const intentId = event.data.object.metadata.intentId

        const intent = await IndexSchema.Intent.findById(intentId)
        if (!intent || !intent._id) return console.log('Intent not found.')
        if (!intent.projectId) return console.log('Project id not found.')
        if (!intent.product) return console.log('Product not found.')
        if (!_.includes(['standard','developer','professional','gb'], intent.product)) return console.log('Product type not found.')

        const project = await IndexSchema.Project.findById(intent.projectId)
        if (!project || !project._id) return console.log('Project not found.')

        if (intent.intentType === 'upgrade') {
            project.projectType = intent.product
            await project.save()
        } else if (intent.intentType === 'datatransfer') {
            project.usageTotal = project.usageTotal + 1000
            project.usageRemaining = project.usageTotal - project.usage
            await project.save()
        }

        intent.status = 'completed'
        await intent.save()

        console.log('Intent completed')
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
                    case 'payment_intent.succeeded':
                        await module.exports.paymentIntentSucceeded(event)
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