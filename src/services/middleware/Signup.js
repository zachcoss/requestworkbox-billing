const
    _ = require('lodash'),
    moment = require('moment'),
    Cognito = require('../tools/cognito').Cognito,
    IndexSchema = require('../../services/tools/schema').schema,
    mailchimp = require('../tools/mailchimp').mailchimp,
    mailchimpTransactional = require('../tools/mailchimp').mailchimpTransactional,
    crypto = require('crypto'),
    Stripe = require('../tools/stripe').Stripe;

module.exports = {
    createCustomer: async function (req, res, next) {
        try {
            const incomingUsername = req.body.username
            const incomingEmail = req.body.email

            let usernameVerified = false
            let emailVerified = false
            let sub = ''
            
            const listUsers = await Cognito.listUsers({
                UserPoolId: process.env.API_AWS_USER_POOL,
                AttributesToGet: [
                    'email',
                    'sub',
                ],
            }).promise()

            const userFilter = _.filter(listUsers.Users, (user) => {
                if (user.Username === incomingUsername) {
                    usernameVerified = true
                    return true
                }
            })

            if (!_.size(userFilter) || _.size(userFilter) > 1) {
                return res.status(401).send('Error locating signup credentials.') 
            }

            const user = userFilter[0]

            _.each(user.Attributes, (attribute) => {
                if (attribute.Name === 'email' && 
                    attribute.Value === incomingEmail) {
                        emailVerified = true
                    }
                if (attribute.Name === 'sub') {
                    sub = attribute.Value
                }
            })

            if (!usernameVerified || !emailVerified) {
                return res.status(401).send('Error verifying signup credentials.') 
            }

            const foundBilling = await IndexSchema.Billing.findOne({ sub: sub })
            if (foundBilling && foundBilling._id) return res.status(401).send('Error verifying signup.')
            
            const foundSetting = await IndexSchema.Setting.findOne({ sub: sub })
            if (foundSetting && foundSetting._id) return res.status(401).send('Error verifying signup.')

            const billing = new IndexSchema.Billing({ sub: sub })
            await billing.save()

            const setting = new IndexSchema.Setting({ sub: sub, username: incomingUsername })
            await setting.save()

            return res.status(200).send('OK')

        } catch (err) {
            console.log('Create customer error', err)
            return res.status(500).send('Create customer error.')
        }
    },
    updateCustomer: async function (req, res, next) {
        try {

            const incomingUsername = req.body.username
            let sub = ''
            let email = ''
            
            const listUsers = await Cognito.listUsers({
                UserPoolId: process.env.API_AWS_USER_POOL,
                AttributesToGet: [
                    'sub','email',
                ],
            }).promise()

            const userFilter = _.filter(listUsers.Users, (user) => {
                if (user.Username === incomingUsername) {
                    return true
                }
            })

            if (!_.size(userFilter) || _.size(userFilter) > 1) {
                return res.status(401).send('Error locating confirm credentials.') 
            }

            const user = userFilter[0]

            if (user.UserStatus !== 'CONFIRMED') {
                return res.status(401).send('Error verifying confirm status.') 
            }

            _.each(user.Attributes, (attribute) => {
                if (attribute.Name === 'sub') {
                    sub = attribute.Value
                }
                if (attribute.Name === 'email') {
                    email = attribute.Value
                }
            })

            const billing = await IndexSchema.Billing.findOne({ sub: sub })
            if (!billing || !billing._id) return res.status(401).send('Could not find billing.')
            if (billing.stripeCustomerId) return res.status(401).send('User already exists.')

            const customer = await Stripe.customers.create({
                email: email,
                metadata: { sub: sub, }
            })

            billing.stripeCustomerId = customer.id
            await billing.save()

            const hash = crypto.createHash('md5').update(email).digest("hex")

            const setListMember = await mailchimp.lists.setListMember(process.env.MAILCHIMP_LIST,hash,{
                email_address: email,
                status_if_new: "subscribed",
            })

            // const sendEmail = await mailchimpTransactional.messages.sendTemplate({
            //     template_name: "Welcome Email",
            //     template_content: [{}],
            //     message: {
            //         to: [{ email, }]
            //     },
            // });

            return res.status(200).send('OK')
            
        } catch (err) {
            console.log('Update customer error', err)
            return res.status(500).send('Update customer error.')
        }
    },
}