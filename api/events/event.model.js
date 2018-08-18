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
 * @returns {Promise} Promise - Result (data or error) of DynamoDB call. 
 */
EventModel.getEvent = function(package_id) {
  return new Promise((resolve, reject) => {
    EventModel
      .query(package_id)
      .limit(1)
      .exec((err, data) => {
        if (err) return resolve({
          error  : true,
          message: err.message,
          stack  : err.stack
        });
        else resolve(data.Items);
      });
  });
}


/**
 * Returns a list of events, filtered on `field` matching given `value`.
 * @param {string} field Field to filter upon
 * @param {any} value Value to constrain filter
 * @returns {Promise} Promise DynamoDB result.
 */
EventModel.getEvents = function(field, value) {
  return new Promise((resolve, reject) => {
    // Create a lookup for our non-hashKey indices
    const indexMap = {
      'user_email' : 'EventUserIndex',
      'room_number': 'EventRoomIndex',
      'approved'   : 'EventApprovedIndex',
      'date'       : 'EventDateIndex'
    };

    EventModel
      .query(value)
      .usingIndex(indexMap[field])
      .exec((err, data) => {
        if (err) return resolve({
          error  : true,
          message: err.message,
          stack  : err.stack,
          field: field,
          value: value
        });
        else resolve(data.Items);
      });
  });
}


/**
 * Creates an event object in our DynamoDB `events` table.
 * @param {object} evt - Object with fields matching event schema.
 * @returns {Promise} Promise - Promise returning object containing created data or error.
 */
EventModel.postEvent = function(evt) {
  return new Promise(function(resolve, reject) {
    EventModel.create(evt, (err, data) => {
      if (err) return resolve({
        error  : true,
        message: err.message,
        stack  : err.stack
      });
      else resolve(data);
    });
  });
}


/**
 * Destroys an event object in our DynamoDB `events` table.
 * @param {integer} package_id - HashKey of DynamoDB Event document.
 * @returns {Promise} result - Promise containing DynamoDB destroy result.
 */
EventModel.deleteEvent = function(package_id) {
  return new Promise(function(resolve, reject) {
    EventModel.destroy(package_id, (err) => {
      if (err) resolve({
        error  : true,
        message: err.message,
        stack  : err.stack
      });
      else resolve({});
    });
  });
}


EventModel.patchEvent = function(evt) {}


module.exports = EventModel;