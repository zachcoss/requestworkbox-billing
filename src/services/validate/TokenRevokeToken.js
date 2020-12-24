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
            throw new Error(err)
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
            throw new Error(err)
        }
    },
    response: function(request, res) {
        let response = _.pickBy(request, function(value, key) {
            return _.includes(keys.concat(permissionKeys), key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Error: Settings not found.') return res.status(401).send('Invalid or missing token.')
        else if (err.message === 'Error: Project not found.') return res.status(400).send('Project not found.')
        else {
            console.log('Create project error', err)
            return res.status(500).send('Request error')
        }
    },
}