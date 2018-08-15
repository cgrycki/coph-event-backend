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

  // Timestamps
  timestamps: true,

  // Schema defined in current directory
  schema: { package_id, ...ModelSchema },

  // Dynamic table names depending on our Node environment
  tableName: createTableName(table_name),

  // Indices for filtering queries
  indexes: [
    {hashKey: 'user_email',  rangeKey: 'package_id', name: 'EventUserIndex',     type: 'global'},
    {hashKey: 'room_number', rangeKey: 'package_id', name: 'EventRoomIndex',     type: 'global'},
    {hashKey: 'approved',    rangeKey: 'package_id', name: 'EventApprovedIndex', type: 'global'},
    {hashKey: 'date',        rangeKey: 'package_id', name: 'EventDateIndex',     type: 'global'}
  ]
});


/* RESTful functions --------------------------------------------------------*/
/**
 * Gets a Event object from our DynamoDB `events` table.
 * @param {integer} package_id - Hash Key of DynamoDB Event document.
 * @returns {object} result - Result (data or error) of DynamoDB call. 
 */
EventModel.getEvent = function(package_id) {
  let result;

  EventModel
    .query(package_id)
    .limit(1)
    .exec((err, data) => {
      if (err) result = {
        error  : true,
        message: err.message,
        stack  : err.stack
      };
      else result = data.Items[0];
    });

  return result;
}


/**
 * Returns a list of events, filtered on `field` matching given `value`.
 * @param {string} field Field to filter upon
 * @param {any} value Value to constrain filter
 */
EventModel.getEvents = function(field, value) {
  let results, error;

  const indexMap = {
    'user_email' : 'EventUserIndex',
    'room_number': 'EventRoomIndex',
    'approved'   : 'EventApprovedIndex',
    'date'       : 'EventDateIndex'
  };

  EventModel
    .query(value)
    .usingIndex(indexMap[field])
    .descending()
    .exec((err, data) => {
      if (err) error = err;
      else results = data.Items;
    });
  
  return { results, error };
}


/**
 * Creates an event object in our DynamoDB `events` table.
 * @param {object} evt - Object with fields matching event schema.
 * @returns {object} result - Result object containing created data or error.
 */
EventModel.postEvent = function(evt) {
  let result;

  EventModel.create(evt, (err, data) => {
    if (err) result = {
      error  : true,
      message: err.message,
      stack  : err.stack
    };
    else result = data;
  });

  return result;
}


/**
 * Destroys an event object in our DynamoDB `events` table.
 * @param {integer} package_id - HashKey of DynamoDB Event document.
 * @returns {(null|Error)} result - DynamoDB destroy result.
 */
EventModel.deleteEvent = function(package_id) {
  let result = null;

  EventModel.destroy(package_id, (err) => {
    if (err !== null) result = err;
  });

  return result;
}


//EventModel.patchEvent = function(evt) {}

module.exports = EventModel;