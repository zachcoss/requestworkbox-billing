const
    ValidateSignup = require('../validate/Signup');

module.exports = {
    createCustomer: async (req, res, next) => {
        try {
            const payload = ValidateSignup.createCustomer.validate(req)
            const authorize = await ValidateSignup.createCustomer.authorize(payload)
            const request = await ValidateSignup.createCustomer.request(authorize)
            return ValidateSignup.createCustomer.response(request, res)
        } catch (err) {
            return ValidateSignup.createCustomer.error(err, res)
        }
    },
    updateCustomer: async (req, res, next) => {
        try {
            const payload = ValidateSignup.updateCustomer.validate(req)
            const authorize = await ValidateSignup.updateCustomer.authorize(payload)
            const request = await ValidateSignup.updateCustomer.request(authorize)
            return ValidateSignup.updateCustomer.response(request, res)
        } catch (err) {
            return ValidateSignup.updateCustomer.error(err, res)
        }
    },
}