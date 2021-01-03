const
    _ = require('lodash'),
    moment = require('moment');

let 
    api = {},
    apiEnd = moment(),

    stripe = {},
    stripeEnd = moment(),

    stripePaths = ['/stripe-webhook'];

module.exports = {
    ratelimit: async function (req, res, next) {
        try {

            let ipAddress;

            if (req.hostname === 'localhost') ipAddress = 'localhost'
            else ipAddress = req.ip

            if (_.includes(stripePaths, req.path)) {
                if (moment().isAfter(stripeEnd)) {
                    stripe = {}
                    stripeEnd = moment().add(60, 'second')
                }

                if (!stripe[ipAddress]) stripe[ipAddress] = 1
                else stripe[ipAddress] = stripe[ipAddress] + 1

                if (stripe[ipAddress] <= 250) return next()

                console.log('Rate limiting Stripe: ', ipAddress)
                return res.sendStatus(429)
            } else {
                if (moment().isAfter(apiEnd)) {
                    api = {}
                    apiEnd = moment().add(5, 'second')
                }

                if (!api[ipAddress]) api[ipAddress] = 1
                else api[ipAddress] = api[ipAddress] + 1

                if (api[ipAddress] <= 10) return next()

                console.log('Rate limiting API: ', ipAddress)
                return res.sendStatus(429)
            }
        } catch (err) {
            console.log('Rate limit error', err)
            return res.status(500).send('Rate limit error.')
        }
    },
    healthcheck: async function (req, res, next) {
        try {
            return res.status(200).send('OK')
        } catch (err) {
            return res.status(500).send('ERROR')
        }
    },
    interceptor: async function (req, res, next) {
        try {
            const paths = ['/create-customer','/update-customer','/stripe-webhook']

            if (req.user && req.user.sub && _.isString(req.user.sub)) {
                if (_.includes(paths, req.path)) return res.status(401).send('Authorization not found.')
                else return next()
            } else {
                if (_.includes(paths, req.path)) return next()
                return res.status(401).send('Authorization not found.')
            }
        } catch (err) {
            console.log('Interceptor error', err)
            return res.status(401).send('Token not found.')
        }
    },
}