/**
 * Authorization via DynamoDB Sessions. Persist user data to the sessions
 * @module auth/Session
 * @requires express-session
 * @requires aws-sdk
 * @requires dynamodb
 * @requires connect-dynamodb
 */

// Dependencies -------------------------------------------------------------*/
const { createTableName } = require('../utils');
const eSession            = require('express-session');
var DynamoDBStore         = require('connect-dynamodb')({ session: eSession });


// Configuration ------------------------------------------------------------*/
const ONE_HOUR       = 60 * 60 * 1000;
const table          = 'sessions';
const dynamo_options = { 
  table: createTableName(table),
  AWSConfigJSON: {
    accessKeyId    : process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
    region         : process.env.MY_AWS_REGION
  }
};


// Store + Sessions ---------------------------------------------------------*/
/**
 * Store - DynamoDB session table
 * @type {object}
 * @var
 * @alias module:auth/Session.store
 */
var store     = new DynamoDBStore(dynamo_options);


/**
 * Session object handling (de)serializing requests to DynamoDB table.
 * @type {object}
 * @const
 * @alias module:auth/Session.session
 */
const session = eSession({
  store            : store,
  secret           : process.env.MY_AWS_SECRET_ACCESS_KEY,
  resave           : false,
  saveUninitialized: false,
  cookie           : {
    maxAge  : ONE_HOUR,
    secure  : true,
    httpOnly: false
  },
  proxy: true
});


/* Exports ------------------------------------------------------------------*/
module.exports = {
  store,
  session
};