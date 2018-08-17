/**
* Express Server
*/

/* Dependencies -------------------------------------------------------------*/
require('dotenv').config();             // Environment variables
var app              = require('express')();
var cors             = require('cors');
var helmet           = require('helmet');
var cookieParser     = require('cookie-parser');
var bodyParser       = require('body-parser');
var validator        = require('express-validator');
var logger           = require('morgan');
var { cors_options } = require('./config/customCors');


/* Further App Configurations -----------------------------------------------*/
// Logging and security best practices
app.use(logger('dev'));
app.use(helmet());

// CORS: Cross origin resource sharing, so we can talk to our frontend
app.use(cors(cors_options));
app.options('*', cors());

// Parsing HTTP Requests: cookies, application/json, application/www-url, and validation
app.use(cookieParser(process.env.MY_AWS_SECRET_ACCESS_KEY));
app.use(bodyParser.json({ type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(validator());

// Reverse proxy
app.set('trust proxy', 1);


/* ROUTES -------------------------------------------------------------------*/
// Only use Xray in production environment
if (process.env.NODE_ENV === 'production') {
  var xray = require('./config/xray');
  app.use(xray.startTrace);
  app.use(xray.requestTrace);
};

app.use('/', require('./api'));

// Close Xray
if (process.env.NODE_ENV === 'production') app.use(xray.endTrace);

module.exports = app;