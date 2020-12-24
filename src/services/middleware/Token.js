const
    ValidateToken = require('../validate/Token');

module.exports = {
    listTokens: async (req, res, next) => {
        try {
            const payload = ValidateToken.listTokens.validate(req)
            const authorize = await ValidateToken.listTokens.authorize(payload)
            const request = await ValidateToken.listTokens.request(authorize)
            return ValidateToken.listTokens.response(request, res)
        } catch (err) {
            return ValidateToken.listTokens.error(err, res)
        }
    },
    generateToken: async (req, res, next) => {
        try {
            const payload = ValidateToken.generateToken.validate(req)
            const authorize = await ValidateToken.generateToken.authorize(payload)
            const request = await ValidateToken.generateToken.request(authorize)
            return ValidateToken.generateToken.response(request, res)
        } catch (err) {
            return ValidateToken.generateToken.error(err, res)
        }
    },
    revokeToken: async (req, res, next) => {
        try {
            const payload = ValidateToken.revokeToken.validate(req)
            const authorize = await ValidateToken.revokeToken.authorize(payload)
            const request = await ValidateToken.revokeToken.request(authorize)
            return ValidateToken.revokeToken.response(request, res)
        } catch (err) {
            return ValidateToken.revokeToken.error(err, res)
        }
    },
}