/**
 * Event DynamoDB model
 */
/* DEPENDENCIES -------------------------------------------------------------*/
const { ModelSchema } = require('./newEvent.schema'); 
var dynamo            = require('dynamodb');
dynamo.AWS.config.update({ region: process.env.AWS_DEFAULT_REGION });


// Create table names depending on environment
const createTableName = require('../utils/index').createTableName;
const client_id       = process.env.APP_NAME;
const env_type        = process.env.EENV;
const table_name      = 'events';


/* MODEL --------------------------------------------------------------------*/
const EventModel = dynamo.define('Event', {
  // Primary keys
  hashKey   : 'package_id',
  rangeKey  : 'date',

  // Timestamps
  timestamps: true,

  // Schema defined in current directory
  schema: ModelSchema,

  // Dynamic table names depending on our Node environment
  tableName: createTableName(client_id, env_type, table_name),

  // Indices for faster queries
  indexes: [
    {hashKey: 'package_id', rangeKey: 'user_email', name: 'EventUserIndex', type: 'global'},
    {hashKey: 'package_id', rangeKey: 'room_number', name: 'EventRoomIndex', type: 'global'},
    {hashKey: 'package_id', rangeKey: 'approved', name: 'EventApprovedIndex', type: 'global'}
  ]
});


module.exports = EventModel;