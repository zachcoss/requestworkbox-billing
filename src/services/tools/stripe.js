const 
    stripe = require('stripe');

module.exports = {
    Stripe: stripe(process.env.STRIPE_KEY)
}