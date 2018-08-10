/**
 * Room Model for DynamoDB.
 * The room is a critical object for the application, much of
 * what the user wants revolves around doing it *somewhere*. 
 * The object is currently a near clone of the MAUI API with 
 * floors added. 
 * 
 * To Do:
 *  - Slim down attributes! 
 * Assign semantic meaning to departments
 * Align rooms reservable status with kelly
 */

/* DEPENDENCIES -------------------------------------------------------------*/
// Set up Dynamo to connect, even in our Lambda env.
var dynamo = require('dynamodb');
dynamo.AWS.config.update({ region: process.env.AWS_REGION });

// Database model validation
const Joi    = require('joi');

// Utility to create our database name
const { createTableName } = require('../utils/index');
const table               = 'rooms';


/* MODEL --------------------------------------------------------------------*/
var Room = dynamo.define('Room', {
  tableName: createTableName(table),
  hashKey: 'roomNumber',
  schema: {
    buildingName   : Joi.string().required(),
    buildingCode   : Joi.string().required(),
    roomNumber     : Joi.string().required(),
    roomName       : Joi.string().allow(null).required(),
    regionList     : Joi.array(),
    featureList    : Joi.array(),
    maxOccupancy   : Joi.number().integer(),
    rmType         : Joi.string().allow(null).required(),
    acadOrgUnitName: Joi.number().integer().allow(null),
    roomCategory   : Joi.string().allow(null),
    roomTypeGroup  : Joi.string().allow(null).required(),
    floor          : Joi.number().integer().required(),
    reservable     : Joi.boolean().required()
  },
  indexes: [{
    hashKey: 'roomNumber', name: 'RoomTypeIndex', type: 'global' 
  }]
});

/* RESTful functions --------------------------------------------------------*/

/**
 * Model function to return a list of rooms as {roomNumber, floor} objects.
 * @param {any} request Express incoming HTTP request.
 * @param {any} response Express outgoing HTTP response.
 */
Room.getRooms = function(request, response) {
  Room
    .scan()
    .where('reservable').equals(true)
    .attributes(['roomNumber', 'floor', 'rmType', 'roomName', 'maxOccupancy'])
    .exec((err, data) => {
      if (err) response.status(404).json(err);
      else response.status(200).json(data.Items);
    });
}

Room.getRoom = function(request, response) {
  // Gather params from request. Verified by the middleware previous.
  let roomNumber = request.params.roomNumber;

  Room
    .query(roomNumber)
    .limit(1)
    .exec((err, data) => {
      if (err) response.status(404).json(err);
      else response.status(200).json(data.Items);
    });
}


module.exports = Room;