/**
* Express Server
*/

/* Dependencies -------------------------------------------------------------*/
require('dotenv').config();             // Environment variables
var express      = require('express');
var path         = require('path');
var cors         = require('cors');
var customCors   = require('./utils/customCors').cors_options;
var helmet       = require('helmet');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('./auth/auth.session');
var validator    = require('express-validator');
var logger       = require('morgan');
var app          = express();


/* Further App Configurations -----------------------------------------------*/
// Logging and security best practices
app.use(logger('dev'));
app.use(helmet());

// CORS: Cross origin resource sharing, so we can talk to our frontend
app.use(cors(customCors));
app.options('*', cors());

// Parsing HTTP Requests: cookies, application/json, application/www-url, and validation
app.use(cookieParser(process.env.MY_AWS_SECRET_ACCESS_KEY));
app.use(bodyParser.json({ type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(validator());

// Reverse proxy and server sessions
app.set('trust proxy', 1);
app.use(session);

// Only use Xray in production environment
if (process.env.NODE_ENV) {
  var xray = require('./utils/xray');
  app.use(xray.startTrace);
  app.use(xray.requestTrace);
}


/* ROUTES -------------------------------------------------------------------*/
app.use('/',       require('./utils/indexRoute'));
app.use('/events', require('./newEvents/newEvent.route'));
app.use('/rooms',  require('./rooms/room.routes'));
app.use('/auth',   require('./auth/auth.routes'));


if (process.env.NODE_ENV) app.use(xray.endTrace); // Close Xray
module.exports = app;