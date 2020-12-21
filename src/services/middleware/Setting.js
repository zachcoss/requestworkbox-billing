const { DataBrew } = require('aws-sdk');

const
    _ = require('lodash'),
    IndexSchema = require('../tools/schema').schema,
    { v4: uuidv4 } = require('uuid'),
    passwordHash = require('pbkdf2-password-hash');


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
    generateToken: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, active: true }
            let tokens = await IndexSchema.Token.find(findPayload)

            if (_.size(tokens) >= 10) {
                return res.status(403).send('API Token Generation Limit Reached')
            }

            let uuid = uuidv4().toUpperCase()
            let snippet = uuid.split('-')[0]
            let token = uuid.replace(/-/g, '')
            let hash = await passwordHash.hash(token)

            let newToken = new IndexSchema.Token({
                active: true,
                sub: req.user.sub,
                snippet,
                hash,
            })

            await newToken.save()

            return res.status(200).send(token)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    revokeToken: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, snippet: req.body.snippet, active: true, }
            let token = await IndexSchema.Token.findOne(findPayload)

            if (!token || !token._id) {
                return res.status(404).send('Token not found')
            }

            token.active = false
            await token.save()

            return res.status(200).send('OK')
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}