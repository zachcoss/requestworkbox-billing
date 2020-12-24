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
    Cognito = require('../tools/cognito').Cognito,
    Stripe = require('../tools/stripe').Stripe,
    mailchimp = require('../tools/mailchimp').mailchimp,
    crypto = require('crypto');

module.exports = {
    validate: function(req, res) {

        // For non-user access
        if (req.user || req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.username) throw new Error('Missing username.')

        if (!_.isAlphanumeric(req.body.username)) throw new Error('Incorrect username type.')

        let payload = {
            incomingUsername: req.body.username,
        }

        return payload
    },
    authorize: async function(payload) {
        try {

            let 
                sub,
                email;

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
                if (user.Username === payload.incomingUsername) return true
                else return false
            })

            if (!_.size(userFilter) || _.size(userFilter) > 1) return res.status(401).send('Error locating signup credentials.') 

            const user = userFilter[0]

            if (user.UserStatus !== 'CONFIRMED') return res.status(401).send('Error verifying confirm status.') 

            _.each(user.Attributes, (attribute) => {
                if (attribute.Name === 'sub') {
                    sub = attribute.Value
                }
                if (attribute.Name === 'email') {
                    email = attribute.Value
                }
            })

            if (!sub || !email) return res.status(401).send('Error verifying signup credentials.')

            const billing = await IndexSchema.Billing.findOne({ sub: sub })
            if (!billing || !billing._id) return res.status(401).send('Could not find billing.')
            if (billing.stripeCustomerId) return res.status(401).send('User already exists.')

            const customer = await Stripe.customers.create({
                email: email,
                metadata: {
                    sub,
                    username: payload.incomingUsername,
                },
            })

            billing.stripeCustomerId = customer.id
            await billing.save()

            const hash = crypto.createHash('md5').update(email).digest("hex")

            const setListMember = await mailchimp.lists.setListMember(process.env.MAILCHIMP_LIST, hash, {
                email_address: email,
                status_if_new: "subscribed",
            })

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
        console.log('Signup: update customer error.', err)
        return res.status(400).send(`Signup: update customer error. ${err.message}`)
    },
}