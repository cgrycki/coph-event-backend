/**
 * Authorization via DynamoDB Sessions. Persist user data to the sessions
 */

// Session database table name
const table               = 'sessions';
const { createTableName } = require('../utils');

// Session middleware
const session = require('express-session');

// Implement a DynamoDB backed session
var DynamoDBStore = require('connect-dynamodb')({ session: session });

// Options for our DB
const dynamo_options = { 
  table: createTableName(table),
  AWSConfigJSON: {
    accessKeyId    : process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
    region         : process.env.MY_AWS_REGION
  }
};

const ONE_HOUR = 60 * 60 * 1000;

module.exports = session({
  store            : new DynamoDBStore(dynamo_options),
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