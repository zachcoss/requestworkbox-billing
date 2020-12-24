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
            throw new Error(err)
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