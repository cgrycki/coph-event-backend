/**
 * Event DynamoDB model
 */
/* DEPENDENCIES -------------------------------------------------------------*/
const Joi   = require('joi');
var dynamo  = require('dynamodb');
dynamo.AWS.config.update({ region: process.env.AWS_DEFAULT_REGION });


// Create table names depending on environment
const createTableName = require('../utils/index').createTableName;
const client_id       = process.env.APP_NAME;
const env_type        = process.env.EENV;
const table_name      = 'events';


/* MODEL --------------------------------------------------------------------*/
const EventModel = dynamo.define('Event', {
  // Primary key
  hashKey: 'id',

  // Timestamps
  timestamps: true,

  schema: {

  },

  // Dynamic table names
  tableName: createTableName(client_id, env_type, table_name)
});


module.exports = EventModel;