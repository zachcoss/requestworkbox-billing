const 
    cron = require('cron'),
    CronJob = cron.CronJob,
    usage = require('./usage');

module.exports.init = () => {
    console.log('initializing billing jobs')

    usage.calculateUsage()

    // // Runs every minute
    const job = new CronJob('0 */1 * * * *', function() {
        usage.calculateUsage()
    }, null, true)

    // // Initialize job
    job.start()
    
}