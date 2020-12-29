const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        },
        isAlphanumeric: function(string) {
            return /^[a-zA-Z0-9_]*$/.test(string)
        },
    }),
    IndexSchema = require('../tools/schema').schema,
    { v4: uuidv4 } = require('uuid'),
    passwordHash = require('pbkdf2-password-hash');

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        
        let payload = {
            sub: req.user.sub,
        }

        return payload
    },
    authorize: async function(payload) {
        try {
            return payload
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function(payload) {
        try {

            let setting = await IndexSchema.Setting.findOne(payload)
            if (!setting || !setting._id) throw new Error('Settings not found.')

            const activeTokens = await IndexSchema.Token.countDocuments({
                sub: setting.sub,
                active: true,
            })

            if (activeTokens >= 10) throw new Error('Rate limit error.')

            let tokens = await IndexSchema.Token.find({
                sub: setting.sub,
                active: false,
            })

            if (_.size(tokens) >= 10) return res.status(429).send('API Token Generation Limit Reached')

            let uuid = uuidv4().toUpperCase()
            let snippet = uuid.split('-')[0]
            let token = uuid.replace(/-/g, '')
            let hash = await passwordHash.hash(token)

            let newToken = new IndexSchema.Token({
                sub: setting.sub,
                snippet,
                hash,
            })

            await newToken.save()

            return token
        } catch(err) {
            throw new Error(err.message)
        }
    },
    response: function(request, res) {
        return res.status(200).send(request)
    },
    error: function(err, res) {
        console.log('Token: generate token error.', err)
        return res.status(400).send(err.message)
    },
}