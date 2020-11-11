const
    _ = require('lodash'),
    IndexSchema = require('../../services/tools/schema').schema,
    moment = require('moment');

module.exports = {
    getAccountType: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub }
            let billing = await IndexSchema.Billing.findOne(findPayload)

            if (!billing) {
                return res.status(401).send('Could not find billing')
            }
            if (!billing.accountType) {
                return res.status(401).send('Could not find billing account type')
            }

            return res.status(200).send({ accountType: billing.accountType })
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    updateAccountType: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub }
            let billing = await IndexSchema.Billing.findOne(findPayload)

            if (!billing) {
                return res.status(401).send('Could not find billing')
            }
            if (!billing.accountType) {
                return res.status(401).send('Could not find billing account type')
            }

            billing.accountType = req.body.accountType || 'free'

            billing.returnWorkflowCount = 0
            billing.queueWorkflowCount = 0
            billing.scheduleWorkflowCount = 0

            billing.returnWorkflowLast = moment().subtract(5, 'minutes')
            billing.queueWorkflowLast = moment().subtract(5, 'minutes')
            billing.scheduleWorkflowLast = moment().subtract(5, 'minutes')

            await billing.save()

            return res.status(200).send('OK')
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}