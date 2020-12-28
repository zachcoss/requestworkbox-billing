const 
    _ = require('lodash'),
    moment = require('moment'),
    IndexSchema = require('../../services/tools/schema').schema;

module.exports = {
    updateProjectUsage: async function(project, usageDays) {
        // get project usage total
        let currentUsage = 0;

        for (usageDay of usageDays) {
            const totalMBs = (usageDay.totalBytesDown + usageDay.totalBytesUp) * 1000 * 1000
            currentUsage = currentUsage + totalMBs
        }

        project.usage = currentUsage
        project.usageRemaining = project.usageTotal - currentUsage

        if (project.usageRemaining < 0) {
            project.globalWorkflowStatus = 'locked'
            console.log('Locked', project.name)
        }

        await project.save()
    },
    startUsageDays: async function(project) {
        const start = moment(project.createdAt)
        let end = moment(project.createdAt).add(1, 'hour')

        if (start.dayOfYear() !== end.dayOfYear()) {
            end = moment(project.createdAt).endOf('day')
        }

        const instances = await IndexSchema.Instance.find({
            projectId: project._id,
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
            projectId: project._id,
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
        console.log('Created initial day.')
    },
    updateUsageDays: async function(project, mostRecentUsageDay) {
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
            console.log('Pending project usage.')
            return;
        }

        const instances = await IndexSchema.Instance.find({
            projectId: project._id,
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
                projectId: project._id,
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
            console.log('Created new day.')
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
            console.log('Updated project usage.')
        }

    },
    calculateUsage: async function() {
        console.log('Calculating project usage.')

        const projects = await IndexSchema.Project.find({})

        const startUsage = new Date()

        for (const project of projects) {

            const usageDays = await IndexSchema.UsageDay.find({ projectId: project._id }).sort({ start: -1 }).limit(1)

            if (!_.size(usageDays)) {
                await module.exports.startUsageDays(project)
            } else {
                await module.exports.updateUsageDays(project, usageDays[0])
                await module.exports.updateProjectUsage(project, usageDays)
            }
        }

        console.log(`Usage job time: ${new Date() - startUsage}ms`)
    },
}