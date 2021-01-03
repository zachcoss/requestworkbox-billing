const 
    express = require('express'),
    router = express.Router(),
    indexMiddleware = require('../../../services/middleware/indexMiddleware');

module.exports.config = function () {

    router.all('*', indexMiddleware.ratelimit)
    router.get('/', indexMiddleware.healthcheck)
    router.all('*', indexMiddleware.interceptor)

    return router;
}