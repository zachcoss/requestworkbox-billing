const 
    cron = require('cron'),
    CronJob = cron.CronJob,
    usage = require('./usage'),
    statuscheck = require('./statuscheck');

module.exports.init = () => {
    console.log('initializing billing jobs')

    // Calculate usage (every minute)
    const job = new CronJob('0 */1 * * * *', function() {
        usage.calculateUsage()
    }, null, true)

    // Status check (15 second interval)
    const statuscheck15 = new CronJob('*/15 * * * * *', function() {
        statuscheck.startStatuschecks(15)
    }, null, true)

    // Status check (30 second interval)
    const statuscheck30 = new CronJob('*/30 * * * * *', function() {
        statuscheck.startStatuschecks(30)
    }, null, true)

    // Status check (60 second interval)
    const statuscheck60 = new CronJob('*/60 * * * * *', function() {
        statuscheck.startStatuschecks(60)
    }, null, true)


    // // Initialize jobs
    job.start()
    statuscheck15.start()
    statuscheck30.start()
    statuscheck60.start()

    
}