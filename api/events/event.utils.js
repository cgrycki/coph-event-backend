/**
 * Event Utilities: middleware functions mapping HTTP requests to our REST 
 * classes and DynamoDB models. Includes validation and error catching.
 * @module events/EventUtils
 * @requires joi
 * @requires dynamodb
 */


// Dependencies -------------------------------------------------------------*/
const { 
  extractWorkflowInfo,
  removeEmptyKeys 
}                             = require('../utils/');
const EventModel              = require('./event.model');
const { 
  ModelSchema,
  package_id
}                             = require('./event.schema');
const Joi                     = require('joi');
const EventSchema = Joi.object().keys({ 
  package_id: package_id.optional(),
  ...ModelSchema
});


// GET Functions ------------------------------------------------------------*/
/**
 * Asynchronously calls DynamoDB `events` table. Handles extracting parameters from request and responding with respect to database result.
 * @function
 * @param {object} request HTTP Request
 * @param {object} response HTTP Response
 * @param {object} next Next function in route
 * @returns {object}
 */
async function getDynamoEventMiddleware(request, response, next) {
  // Gather Package ID and try converting to number before making DynamoDB call.
  const package_id = +request.params.package_id;
  const evt        = await EventModel.getEvent(package_id);

  // If EventModel returned an error cut the response short.
  if (evt.error !== undefined) return response.status(400).json(evt);
  
  // If EventModel didn't find anything, return
  if (evt.length === 0) return response.status(404).json({ message: 'couldnt find that'});
  
  // Otherwise we found the event object, convert 'approval' from string => bool
  else {
    request.events = evt;
    return next();
  };
}


/**
 * Attaches a filtered list of event objects to request. Infers DynamoDB index and value to use for filter from request. 
 * @function
 * @param {object} request HTTP request from frontend.
 * @param [request.path] {string} - Route endpoint request is hitting
 * @param [request.hawkid] {string} - HawkID from user session.
 * @param [request.params] {(string|undefined)} - Params *can* have value depending on the endpoint called.
 * @param {object} response HTTP response
 * @param {object} next Next Function in server route (final response).
 * @returns {object}
 */
async function getDynamoEventsMiddleware(request, response, next) {
  // Infer field from request path: we have different endpoints calling this 
  // middleware function.
  const path_to_field = {
    '/my'        : 'user_email',
    '/date'      : 'date',
    '/unapproved': 'approved',
    '/room'      : 'room_number'
  };
  const path_to_value = {
    '/my'        : `${request.hawkid}@uiowa.edu`,
    '/date'      : request.params.date,
    '/unapproved': false,
    '/room'      : request.params.room_number
  };

  // Fetch items from DynamoDB
  const field  = path_to_field[request.path];
  const value  = path_to_value[request.path];
  const {
    error,
    events,
    package_ids
  }            = await EventModel.getEvents(field, value);

  // Either response with error or pass on the DynamoDB info
  if (error !== undefined) return response.status(400).json(result);
  else {
    request.events      = events;
    request.package_ids = package_ids;
    return next();
  };
}



// POST + PATCH Functions ---------------------------------------------------*/
/**
 * Validates the potential Event information in a POST request.  
 * @param {object} request HTTP request containing form data.
 * @param [request.body.form] {object} - Object containing form fields from frontend.
 * @param {object} response HTTP response
 * @param {object} next Next function in middleware stack.
 * @returns {object}
 */
function validateEvent(request, response, next) {
  // Gather form data from body json object
  let form_info = { ...request.body.form };
  let { error, value } = Joi.validate(form_info, EventSchema, {abortEarly: false});

  // Check for errors
  if (error !== null) return response.status(400).json({ error, form_info });
  else {
    request.workflow_data = extractWorkflowInfo(value);
    next();
  }
}


/**
 * Asynchronously creates/overwrites an event object in DynamoDB `events` table. If the event exists, we overwrite it.
 * 
 * @async
 * @function
 * @param {object} request HTTP request from frontend.
 * @param [request.body] {object} - Form Data as an object, parsed by Multer if POST and BodyParser if PATCH (JSON).
 * param [request.package_id] {Integer} - Package ID for Workflow and Dynamo, taken from either Workflow response (POST) or params (PATCH).
 * @param {object} response HTTP response.
 * @param {object} next Next function in middleware stack.
 * @returns {object}
 */
async function postDynamoEventMiddleware(request, response, next) {
  // Assumes postWorkflowEventMiddleware has been called before this to attach the package_id
  const pid    = request.package_id;
  let evt    = { ...request.body.form, package_id: pid };

  // Strip empty values from the Setup_MFK
  removeEmptyKeys(evt.setup_mfk);

  // Create the event
  const result = await EventModel.postEvent(evt);

  // If there was an error return, otherwise pass on the information
  if (result.error) return response.status(400).json({error: result, data: evt, workflow_data: request.workflow_data});
  else {
    request.dynamo_data = result;
    return next();
  };
}


/**
 * Updates an Event object in our DynamoDB `events` table.
 * @function
 * @param {object} request Incoming HTTP request
 * @param {object} request Outgoing HTTP response
 * @param {object} next Following middleware function
 * @returns {object}
 */
async function patchDynamoEventMiddleware(request, response, next) {
  const evt    = { ...request.body.form };

  // Strip empty values from the Setup_MFK
  removeEmptyKeys(evt.setup_mfk);

  const result = await EventModel.patchEvent(evt);

  // If there was an error return, otherwise pass on the information
  if (result.error) return response.status(400).json(result);
  else {
    // Next middleware (Workflow permissions) expects an array of event objects
    request.events = [result];
    return next();
  };
}


/**
 * Callback updating DynamoDB data according to Workflow data.
 * @param {object} request Incoming HTTP request from Workflow
 * @param {object} response Outgoing HTTP response
 * @returns {object}
 */
async function processWorkflowCallback(request, response) {
  let { packageId: package_id, state } = request.body;
  let result;

  console.log('body', request.body);
  console.log('params', request.params);
  console.log('query', request.query);
  console.log('ogURL', request.originalUrl);
  console.log('METHOD', request.method);

  if (state === 'COMPLETE') {
    result = await EventModel.patchEvent({ package_id: package_id, approved: 'true'});
  }
  // else if (state === 'VOID')
  // else ROUTING

  // Handle response
  if (result === undefined) return response.status(400).end();
  else if (request.error) {
    console.log('ERROR', result);
    return response.status(400).end();
  }
  else return response.status(200).end();
}


// DELETE Functions ---------------------------------------------------------*/
/**
 * Removes an event from DynamoDB.
 * @param {object} request Incoming HTTP request
 * @param {object} response Outgoing HTTP response
 * @param {object} next Following function to call
 * @returns {object}
 */
async function deleteDynamoEventMiddleware(request, response, next) {
  // Get hashKey of dynamo object
  const { package_id } = request.params;
  
  // Wait for dynamoDB to destroy object
  const result = await EventModel.deleteEvent(+package_id);

  // Respond appropriately
  if (result.error) return response.status(400).json(result);
  else return next();
}


module.exports = {
  validateEvent,
  getDynamoEventMiddleware,
  getDynamoEventsMiddleware,
  postDynamoEventMiddleware,
  patchDynamoEventMiddleware,
  deleteDynamoEventMiddleware,
  processWorkflowCallback
};