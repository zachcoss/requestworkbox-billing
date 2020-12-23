const 
    jwt = require('express-jwt'),
    jwksRsa = require('jwks-rsa'),
    jwksUri = `https://cognito-idp.${process.env.API_AWS_REGION}.amazonaws.com/${process.env.API_AWS_USER_POOL}/.well-known/jwks.json`,
    jwksAud = `${process.env.API_AWS_USER_POOL_CLIENT}`,
    jwksIss = `https://cognito-idp.us-east-1.amazonaws.com/${process.env.API_AWS_USER_POOL}`,
    jwksAlg = ['RS256'],
    _ = require('lodash');

/**
 * 
 * JWT Middleware configuration
 * **/
module.exports.config = () => {

    return jwt({
        secret: jwksRsa.expressJwtSecret({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 10,
            jwksUri: jwksUri
        }),
        // allows access token instead of id token
        // audience: jwksAud,
        issuer: jwksIss,
        algorithms: jwksAlg
    })
    .unless({
        custom: function(req) {
            // Does not support x-api-key
            if (req.path === '/') return true
            else if (_.includes(req.path, '/create-customer')) return true
            else if (_.includes(req.path, '/update-customer')) return true
            else if (_.includes(req.path, '/stripe-webhook')) return true
            else return false
        },
    })
}

/**
 * 
 * Middleware for handling JWT errors
*/
module.exports.handler = (err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        return res.status(401).send('Invalid or missing token')
    }
}