const 
    cron = require('cron'),
    CronJob = cron.CronJob,
    usage = require('./usage');

module.exports.init = () => {
    console.log('initializing billing jobs')

    // Calculate usage (every minute)
    const job = new CronJob('0 */1 * * * *', function() {
        usage.calculateUsage()
    }, null, true)

    // // Initialize jobs
    job.start()

}