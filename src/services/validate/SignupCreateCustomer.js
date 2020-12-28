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
    Cognito = require('../tools/cognito').Cognito;

module.exports = {
    validate: function(req, res) {

        // For non-user access
        if (req.user) throw new Error('Invalid or missing token.')
        if (!req.body.username) throw new Error('Missing username.')
        if (!req.body.email) throw new Error('Missing email.')

        if (!_.isAlphanumeric(req.body.username)) throw new Error('Incorrect username type.')
        if (!_.isString(req.body.email)) throw new Error('Incorrect email type.')

        let payload = {
            incomingUsername: req.body.username,
            incomingEmail: req.body.email,
        }

        return payload
    },
    authorize: async function(payload) {
        try {

            let 
                usernameVerified = false,
                emailVerified = false,
                sub;

            const userList = await Cognito.
            listUsers({
                UserPoolId: process.env.API_AWS_USER_POOL,
                AttributesToGet: [
                    'email',
                    'sub',
                ],
            })
            .promise()

            const userFilter = _.filter(userList.Users, (user) => {
                if (user.Username === payload.incomingUsername) {
                    usernameVerified = true
                    return true
                } else {
                    return false
                }
            })

            if (!_.size(userFilter) || _.size(userFilter) > 1) throw new Error('Error locating signup credentials.') 

            const user = userFilter[0]

            _.each(user.Attributes, (attribute) => {
                if (attribute.Name === 'email' && (attribute.Value === payload.incomingEmail)) {
                    emailVerified = true
                }
                if (attribute.Name === 'sub') sub = attribute.Value
            })

            if (!usernameVerified || !emailVerified || !sub) throw new Error('Error verifying signup credentials.')

            const billing = new IndexSchema.Billing({
                sub,
            })
            await billing.save()

            const setting = new IndexSchema.Setting({
                sub,
                username: payload.incomingUsername,
            })
            await setting.save()

            return 'OK'
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function(payload) {
        try {
            return payload
        } catch(err) {
            throw new Error(err.message)
        }
    },
    response: function(request, res) {
        return res.status(200).send(request)
    },
    error: function(err, res) {
        console.log('Signup: create customer error.', err)
        return res.status(400).send(`Signup: create customer error. ${err.message}`)
    },
}