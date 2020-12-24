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
    IndexSchema = require('../tools/schema').schema;

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.snippet) throw new Error('Missing snippet.')
        if (!_.isString(req.body.snippet)) throw new Error('Incorrect snippet type.')
        if (_.size(req.body.snippet) !== 8) throw new Error('Incorrect snippet type.')
        
        let payload = {
            sub: req.user.sub,
            snippet: req.body.snippet,
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

            const archivedTokens = await IndexSchema.Token.countDocuments({
                sub: setting.sub,
                active: false,
            })

            if (archivedTokens >= 10) throw new Error('Rate limit error.')

            let token = await IndexSchema.Token.findOne({
                sub: setting.sub,
                active: true,
                snippet: payload.snippet,
            })

            if (!token || !token._id) return res.status(401).send('Token not found.')

            token.active = false
            await token.save()

            return 'OK'
        } catch(err) {
            throw new Error(err.message)
        }
    },
    response: function(request, res) {
        return res.status(200).send(request)
    },
    error: function(err, res) {
        console.log('Token: revoke token error.', err)
        return res.status(400).send(`Token: revoke token error. ${err.message}`)
    },
}