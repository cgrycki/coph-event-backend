/**
 * Event DynamoDB model
 */
/* DEPENDENCIES -------------------------------------------------------------*/
var dynamo            = require('dynamodb');
dynamo.AWS.config.update({ region: process.env.AWS_DEFAULT_REGION });
const { 
  ModelSchema,
  package_id
}                     = require('./event.schema'); 


// Create table names depending on environment
const { createTableName } = require('../utils/index');
const table_name          = 'events';


/* MODEL --------------------------------------------------------------------*/
const EventModel = dynamo.define('Event', {
  // Primary keys
  hashKey   : 'package_id',
  rangeKey  : 'date',

  // Timestamps
  timestamps: true,

  // Schema defined in current directory
  schema: { package_id, ...ModelSchema },

  // Dynamic table names depending on our Node environment
  tableName: createTableName(table_name),

  // Indices for faster queries
  indexes: [
    {hashKey: 'package_id', rangeKey: 'user_email',  name: 'EventUserIndex',     type: 'global'},
    {hashKey: 'package_id', rangeKey: 'room_number', name: 'EventRoomIndex',     type: 'global'},
    {hashKey: 'package_id', rangeKey: 'approved',    name: 'EventApprovedIndex', type: 'global'}
  ]
});


/* RESTful functions --------------------------------------------------------*/
/**
 * Returns a list of events, filtered by params.
 * @param {string} field Field to filter upon
 * @param {any} value Value to constrain filter
 */
EventModel.filterEvents = function(field, value) {
  let results, error;

  const fieldIndexMap = {
    'user': 'EventUserIndex',
    'room': 'EventRoomIndex',
    'approved': 'EventApprovedIndex'
  };

  const filterExpressionMap = {
    'approved': '#approve = :false'
  };

  const expressionValueMap = {
    'approved': {':false': false}
  };

  const expressionNameMap = {
    'approved': { '#approve': 'approved' }
  };

  const expressionProjectionMap = {
    'approved': '#approve'
  };

  /*EventModel
    .scan()
    .filterExpression(filterExpressionMap[field])
    .expressionAttributeValues(expressionValueMap[field])
    .expressionAttributeNames(expressionNameMap[field])
    .projectionExpression(expressionProjectionMap[field])
    .exec((err, data) => {
      if (err) error = err;
      else results = data.Items;
    });
  */
  EventModel
    .scan()
    .filter(field).equals(value)
    .exec((err, data) => {
      if (err) error = err;
      else results = data.Items;
    });
  
  return { results, error };
}


module.exports = EventModel;