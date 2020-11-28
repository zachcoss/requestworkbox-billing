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
                return res.status(401).send('error locating signup credentials') 
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
                return res.status(401).send('error verifying signup credentials') 
            }

            const billing = new IndexSchema.Billing({ sub: sub, accountType: 'free' })
            await billing.save()

            const setting = new IndexSchema.Setting({ sub: sub })
            await setting.save()

            return res.status(200).send('OK')

        } catch (err) {
            console.log('create customer error', err)
            return res.status(500).send('error creating customer')
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
                return res.status(401).send('error locating confirm credentials') 
            }

            const user = userFilter[0]

            if (user.UserStatus !== 'CONFIRMED') {
                return res.status(401).send('error verifying confirm status') 
            }

            _.each(user.Attributes, (attribute) => {
                if (attribute.Name === 'sub') {
                    sub = attribute.Value
                }
                if (attribute.Name === 'email') {
                    email = attribute.Value
                }
            })

            const findPayload = { sub: sub }
            let billing = await IndexSchema.Billing.findOne(findPayload)

            if (!billing) {
                return res.status(401).send('Could not find billing')
            }
            if (!billing.accountType) {
                return res.status(401).send('Could not find billing account type')
            }

            const customer = await Stripe.customers.create({
                email: email,
                metadata: {
                    sub: sub,
                }
            })

            billing.stripeCustomerId = customer.id

            billing.accountType = 'free'

            billing.returnWorkflowCount = 0
            billing.queueWorkflowCount = 0
            billing.scheduleWorkflowCount = 0

            billing.returnWorkflowLast = moment().subtract(5, 'minutes')
            billing.queueWorkflowLast = moment().subtract(5, 'minutes')
            billing.scheduleWorkflowLast = moment().subtract(5, 'minutes')

            await billing.save()

            const hash = crypto.createHash('md5').update(email).digest("hex")

            const setListMember = await mailchimp.lists.setListMember(process.env.MAILCHIMP_LIST,hash,{
                email_address: email,
                status_if_new: "subscribed",
            });

            // const sendEmail = await mailchimpTransactional.messages.sendTemplate({
            //     template_name: "Welcome Email",
            //     template_content: [{}],
            //     message: {
            //         to: [{ email, }]
            //     },
            // });

            return res.status(200).send('OK')
            
        } catch (err) {
            console.log(err)
            return res.status(500).send('error updating customer')
        }
    },
}