const 
    _ = require('lodash'),
    moment = require('moment'),
    stripe = require('../tools/stripe').Stripe,
    IndexSchema = require('../../services/tools/schema').schema;

module.exports = {
    updateStripe: async function(user) {
        if (!user.stripeCurrentPeriodStart || user.stripeCurrentPeriodStart === 0) {
            console.log('skipping update to stripe')
            return;
        }

        if (!user.stripeSubscriptionId) {
            console.log('missing stripe subscription id')
            return;
        }
        
        console.log('updating stripe')

        const usageDays = await IndexSchema.UsageDay.find({
            sub: user.sub,
            start: {
                $gte: user.stripeCurrentPeriodStart,
            },
        }).sort({ start: -1 })

        let totalBytesDown = 0,
            totalBytesUp = 0;

        _.each(usageDays, (usageDay) => {
            totalBytesDown = totalBytesDown + (usageDay.totalBytesDown || 0)
            totalBytesUp = totalBytesUp + (usageDay.totalBytesUp || 0)
        })

        let finalKB = (totalBytesDown + totalBytesUp) / 1024
        let finalMB = finalKB / 1024
        
        if (finalMB < 1) {
            console.log('Less than 1MB, skipping', finalMB)
        } else {
            console.log('Reporting finalMB', finalMB)
            
            await stripe.subscriptionItems.createUsageRecord(user.stripeSubscriptionId, {
                quantity: finalMB,
                timestamp: moment(usageDays[0].end).unix(),
                action: 'set',
            })
        }
    },
    startUsageDays: async function(user) {
        const start = moment(user.createdAt)
        let end = moment(user.createdAt).add(1, 'hour')

        if (start.dayOfYear() !== end.dayOfYear()) {
            end = moment(user.createdAt).endOf('day')
        }

        const instances = await IndexSchema.Instance.find({
            sub: user.sub,
            createdAt: {
                $gte: start,
                $lt: end,
            },
        })

        let totalBytesDown = 0,
            totalBytesUp = 0,
            totalMs = 0;

        _.each(instances, (instance) => {
            totalBytesDown = totalBytesDown + (instance.totalBytesDown || 0)
            totalBytesUp = totalBytesUp + (instance.totalBytesUp || 0)
            totalMs = totalMs + (instance.totalMs || 0)
        })

        let usageDayData = {
            sub: user.sub,
            start,
            end,
            totalBytesDown,
            totalBytesUp,
            totalMs,
            hours: [{
                start,
                end,
                totalBytesDown,
                totalBytesUp,
                totalMs,
            }]
        }

        const usageDay = new IndexSchema.UsageDay(usageDayData)
        await usageDay.save()
        console.log('created new')
    },
    updateUsageDays: async function(user, mostRecentUsageDay) {
        let start = moment(mostRecentUsageDay.end)
        let end = moment(mostRecentUsageDay.end).add(1, 'hour')

        if (start.dayOfYear() !== end.dayOfYear()) {
            
            const newDayCheck = moment(mostRecentUsageDay.end).add(1, 'second')

            if (start.dayOfYear() !== newDayCheck.dayOfYear()) {
                start = moment(mostRecentUsageDay.end).add(1, 'second')
                end = moment(mostRecentUsageDay.end).add(1, 'second').add(1, 'hour')
            } else {
                end = moment(mostRecentUsageDay.end).endOf('day')
            }
            
        }

        if (end.isAfter(moment().subtract(15 ,'minutes'))) {
            console.log('pending')
            return;
        }

        const instances = await IndexSchema.Instance.find({
            sub: mostRecentUsageDay.sub,
            createdAt: {
                $gte: start,
                $lt: end,
            },
        })

        let totalBytesDown = 0,
            totalBytesUp = 0,
            totalMs = 0;

        _.each(instances, (instance) => {
            totalBytesDown = totalBytesDown + (instance.totalBytesDown || 0)
            totalBytesUp = totalBytesUp + (instance.totalBytesUp || 0)
            totalMs = totalMs + (instance.totalMs || 0)
        })

        if (moment(mostRecentUsageDay.end).dayOfYear() !== start.dayOfYear()) {
            let usageDayData = {
                sub: mostRecentUsageDay.sub,
                start,
                end,
                totalBytesDown,
                totalBytesUp,
                totalMs,
                hours: [{
                    start,
                    end,
                    totalBytesDown,
                    totalBytesUp,
                    totalMs,
                }]
            }
    
            const usageDay = new IndexSchema.UsageDay(usageDayData)
            await usageDay.save()
            console.log('new day')

            // Update stripe with most recent max
            await module.exports.updateStripe(user)
        } else {
            mostRecentUsageDay.end = end
            mostRecentUsageDay.hours.push({
                start,
                end,
                totalBytesDown,
                totalBytesUp,
                totalMs,
            })

            mostRecentUsageDay.totalBytesDown = mostRecentUsageDay.totalBytesDown + (totalBytesDown || 0)
            mostRecentUsageDay.totalBytesUp = mostRecentUsageDay.totalBytesUp + (totalBytesUp || 0)
            mostRecentUsageDay.totalMs = mostRecentUsageDay.totalMs + (totalMs || 0)

            await mostRecentUsageDay.save()
            console.log('updated')
        }

    },
    calculateUsage: async function() {
        console.log('Searching for users')

        const users = await IndexSchema.Billing.find()

        for (const user of users) {
            const userSub = user.sub
            const usageDays = await IndexSchema.UsageDay.find({ sub: userSub }).sort({ start: -1 }).limit(1)

            if (!_.size(usageDays)) {
                await module.exports.startUsageDays(user)
            } else {
                await module.exports.updateUsageDays(user, usageDays[0])
            }
        }
    },
}