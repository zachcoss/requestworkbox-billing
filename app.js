const dotenv = require('dotenv')
dotenv.config()

const express = require('express')
const mongoose = require('mongoose')
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const jobs = require('./src/services/tools/jobs');

const http = require('http');
const app = express();
const port = process.env.PORT

const jwt = require('./src/shared/plugins/network/jwt')
const router = require('./src/shared/plugins/network/router')
const routerStripeWebhook = require('./src/shared/plugins/network/routerStripeWebhook')

app.set('port', port);

app.use(logger('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
    // includes stripe
    origin: ['http://localhost:8080','https://dashboard.requestworkbox.com','https://api.stripe.com'],
    methods: ['GET','POST'],
    allowedHeaders: ['x-api-key','Authorization'],
    exposedHeaders: [],
    credentials: true,
    maxAge: 86400,
}))

// Rearranged middleware to support raw stripe webhook body payloads
app.use('/', routerStripeWebhook.config())

app.use(express.json())
app.use(jwt.config())
app.use('/', router.config())
app.use(jwt.handler)

const server = http.createServer(app);

const socketService = require('./src/services/tools/socket')
socketService.io = require('socket.io')(server)

server.on('error', function(error) {
    return new Error('Server error', error)
});
server.on('listening', function() {
    console.log('listening')
    console.log('opening connection to db')

    // mongoose.set('debug', true)
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useFindAndModify', false);
    mongoose.set('useCreateIndex', true);
    mongoose.set('useUnifiedTopology', true);

    mongoose.connect(process.env.MONGODBURL)
    
    const db = mongoose.connection
    db.on('error', function(error) {
        return new Error('DB connection error', error)
    });
    db.once('open', function () {
        console.log('connected to db')
        console.log('ready')
        jobs.init()
    });
});

server.listen(port);