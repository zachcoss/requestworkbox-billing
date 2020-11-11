const 
    cron = require('cron'),
    CronJob = cron.CronJob;

module.exports.init = () => {
    console.log('initializing billing jobs')

    // // Runs every 5 seconds
    // const job = new CronJob('*/5 * * * * *', function() {
    //     console.log('Billing job')
    // }, null, true)

    // // Initialize job
    // job.start()
    
}