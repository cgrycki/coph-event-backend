// DynamoDB Events model

/* DEPENDENCIES -------------------------------------------------------------*/
// Set up Dynamo to connect, even in our Lambda env.
var dynamo = require('dynamodb');
dynamo.AWS.config.update({
  region         : process.env.AWS_DEFAULT_REGION
});

// Database model validation
var Joi    = require('joi');

// Utility to create our database name
const createTableName = require('../utils/index').createTableName;
const name            = process.env.APP_NAME;
const env             = process.env.EENV;
const table           = 'events';


/* MODEL --------------------------------------------------------------------*/
var EventModel = dynamo.define('Event', {
  // Set primary key
  hashKey: 'id',

  // Add timestamp attributes (updatedAt, createdAt)
  timestamps: true,

  schema: {
    id: dynamo.types.uuid(),
    packageId: dynamo.types.uuid().allow(false).default(false),
    userEmail: Joi.string().email().required(),
    textField: Joi.string().min(1).max(50).required(),
    approved: Joi.boolean().default(false)
  },

  tableName: createTableName(name, env, table)
});


/* RESTful functions --------------------------------------------------------*/
/**
 * Checks to see if a document with a given :Id exists in our DB
 * @param {object} request Express HTTP request.
 * @param {object} response Express HTTP response to act upon.
 * @param {function} next Function after this middleware
 */
EventModel.checkEventMiddleware = function(request, response, next) {
  // Previous middleware has confirmed an :Id param exists.
  let id = request.params.id;

  // Check existence
  EventModel
    .query(id)
    .exec((error, data) => {
      // If there are any errors, return them
      if (error) return response.status(400).json({ error: JSON.stringify(error) });

      // Otherwise check if this is a POST request, and return an error if it exists
      else if ((request.method === 'POST') && (data.Items.length !== 0)) {
        return response.status(400).json({ error: "Event `{id} exists"});
      }

      // No event found: Return error
      else if (data.Items.length === 0) {
        return response.status(404).json({ error: "Not found"});
      }

      // Exists and we're not trying to create, next middleware!
      else {
        request.item = data.Items[0];
        next();
      };
    });
};

/**
 * Router callback function for GET /events. Lists all events in database.
 * @param {object} request Express HTTP request.
 * @param {object} response Express HTTP response to act upon.
 */
EventModel.listEvents = function(request, response) {
  return this
    .scan()
    .exec((error, data) => {
      if (error) return response.status(400).json({ error: JSON.stringify(error) });
      else return response.status(200).json(data.Items);
    });
};

/**
 * Router callback function for GET /events. Lists all events in database.
 * @param {object} request Express HTTP request.
 * @param {object} response Express HTTP response to act upon.
 */
EventModel.listEventsMiddleware = function(request, response, next) {
  EventModel
    .scan()
    .exec((error, data) => {
      if (error) return response.status(400).json({ error: JSON.stringify(error), stack: error.stack });
      else {
        request.items = data.Items;
        next();
      };
    });
};

/**
 * Wrapper function for POST /events.
 * @param {object} request Express HTTP request.
 * @param {object} response Express HTTP response to act upon.
 */
EventModel.saveEvent = function(request, response) {
  // Gather params from request.
  let params = request.body;

  return this.create(params, (error, data) => {
    if (error) return response.status(400).json({ error: JSON.stringify(error) });
    else return response.status(201);
  });
};

/**
 * Middleware for POST /events. Uses next so we can stack more middleware after.
 * @param {object} request Express HTTP request.
 * @param {object} response Express HTTP response to act upon.
 * @param {function} next Function after this middleware
 */
EventModel.saveEventMiddleware = function(request, response, next) {
  // Gather params
  let params = request.body;

  // Create an event, returning an error if present otherwise going to the next().
  EventModel.create(params, (error, data) => {
    if (error) return response.status(400).json({ error: JSON.stringify(error) });
    else next();
  });
};

/**
 * Router callback for DELETE /events. Does not go anywhere after
 * @param {object} request Express HTTP request.
 * @param {object} response Express HTTP response to act upon.
 */
EventModel.deleteEvent = function(request, response) {
  // Gather params
  let id = request.params.id;

  // Delete the event, and return
  EventModel.destroy(id, (error, data) => {
    // Report any errors
    if (error) return response.status(400).json({ error: JSON.stringify(error) });

    // Otherwise send the OK
    return response.status(200).end();
  });
};

/**
 * Middleware for DELETE /events. 
 * @param {object} request Express HTTP request.
 * @param {object} response Express HTTP response to act upon.
 * @param {function} next
 */
EventModel.deleteEventMiddleware = function(request, response, next) {
  // Gather params
  let id = request.params.id;

  // Delete the event, and return
  EventModel.destroy(id, (error, data) => {
    // Report any errors
    if (error) return response.status(400).json({ error: JSON.stringify(error) });

    // Otherwise send the OK
    else next();
  });
};


module.exports = EventModel;
