const
    _ = require('lodash'),
    IndexSchema = require('../tools/schema').schema;

module.exports = {
    updateGlobalWorkflowStatus: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub }
            let setting = await IndexSchema.Setting.findOne(findPayload)

            if (!setting) {
                return res.status(401).send('Could not find setting')
            }

            setting.globalWorkflowStatus = req.body.globalWorkflowStatus
            await setting.save()

            return res.status(200).send('OK')
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    updateEmailAlert: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub }
            let setting = await IndexSchema.Setting.findOne(findPayload)

            if (!setting) {
                return res.status(401).send('Could not find setting')
            }

            const emailAlertType = req.body.emailAlertType
            setting[emailAlertType] = req.body.emailAlertValue

            await setting.save()

            return res.status(200).send('OK')
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}