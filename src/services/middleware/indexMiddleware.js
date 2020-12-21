const
    _ = require('lodash');

module.exports = {
    healthcheck: async function (req, res, next) {
        try {
            return res.status(200).send('OK')
        } catch (err) {
            return res.status(500).send('ERROR')
        }
    },
    validateOrigin: async function (req, res, next) {
        try {
            const origin = `${req.protocol}://${req.hostname}`
            const allowOrigin = process.env.NODE_ENV === 'production' ? 'https://dashboard.requestworkbox.com' : 'http://localhost'
            
            if (origin !== allowOrigin) throw new Error()
            else return next()
        } catch (err) {
            console.log(err)
            return res.status(500).send('error validating origin user')
        }
    },
    interceptor: async function (req, res, next) {
        try {
            if (req.user && req.user.sub && _.isString(req.user.sub)) return next()
            else {
                if (req.path === '/create-customer' && req.method === 'POST') return next()
                if (req.path === '/update-customer' && req.method === 'POST') return next()
                if (req.path === '/stripe-webhook' && req.method === 'POST') return next()
                return res.status(401).send('user not found')
            }
        } catch (err) {
            console.log(err)
            return res.status(500).send('error intercepting user')
        }
    },
}