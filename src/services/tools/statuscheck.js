const 
    _ = require('lodash'),
    IndexSchema = require('./schema').schema,
    Axios = require('axios'),
    Agent = require('agentkeepalive'),
    keepAliveAgent = new Agent({
        maxSockets: 100,
        maxFreeSockets: 10,
        timeout: 60000, // active socket keepalive for 60 seconds
        freeSocketTimeout: 30000, // free socket keepalive for 30 seconds
    }),
    axios = Axios.create({httpAgent: keepAliveAgent});

module.exports = {
    requestStatusCheck: async function(statuscheck) {
        const request = await axios({
            url: `${process.env.API_URL}/statuscheck-workflow/${statuscheck.workflowId}`,
            method: 'POST',
        })
        return request
    },
    startStatuschecks: async function(interval) {

        const statuschecks = await IndexSchema.Statuscheck.find({ interval: interval, active :true, status: 'running', })

        for (const statuscheck of statuschecks) {
            try {
                console.log('requesting statuscheck: ', statuscheck._id)
                await module.exports.requestStatusCheck(statuscheck)
            } catch(err) {
                if (err.response && err.response.data) {
                    console.log('statuscheck request error', err.response.data)
                } else {
                    console.log('statuscheck request error', err.message)
                }
            } 
        }
    },
}