/**
 * Event Utilities
 */


/* Dependencies -------------------------------------------------------------*/
const { extractWorkflowInfo } = require('../utils/');
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


/* GET Functions ------------------------------------------------------------*/
/**
 * Asynchronously calls DynamoDB `events` table. Handles extracting parameters from request and responding with respect to database result.
 * @module getDynamoEventMiddleware
 * @function
 * @param {Object} request HTTP Request
 * @param {Object} response HTTP Response
 * @param {Object} next Next function in route
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
    // Some of our objects are still using booleans (woof)
    //evt[0].approval = evt[0].approval === "true"

    request.evt = evt[0];
    return next();
  };
}


/**
 * Attaches a filtered list of event objects to request. Infers DynamoDB index and value to use for filter from request. 
 * @param {Object} request HTTP request from frontend.
 * @param [request.path] {string} - Route endpoint request is hitting
 * @param [request.hawkid] {string} - HawkID from user session.
 * @param [request.params] {(string|undefined)} - Params *can* have value depending on the endpoint called.
 * @param {Object} response HTTP response
 * @param {Object} next Next Function in server route (final response).
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
    evts,
    package_ids
  }            = await EventModel.getEvents(field, value);

  // Either response with error or pass on the DynamoDB info
  if (error !== undefined) return response.status(400).json(result);
  else {
    request.evts        = evts;
    request.package_ids = package_ids;
    return next();
  };
}



/* POST + PATCH Functions ---------------------------------------------------*/
/**
 * Validates the potential Event information in a POST request.  
 * @param {Object} request HTTP request containing form data.
 * @param [request.body] {Object} - Form Data as an object, parsed by Multer.
 * @param {Object} response HTTP response
 * @param {Object} next Next function in middleware stack.
 */
function validateEvent(request, response, next) {
  // Gather the form information. Then validate with Joi.
  let form_info = { ...request.body };
  let { error, value:valid_info } = Joi.validate(form_info, EventSchema, { abortEarly: false });

  // If there's any invalid fields, return with information
  if (error !== null) return response.status(400).json({ error, valid_info });
  // Otherwise, create a Workflow entry (slimmed down information for inbox)
  else {
    request.workflow_data = extractWorkflowInfo(valid_info);
    return next();
  };
}


/**
 * Asynchronously creates/overwrites an event object in DynamoDB `events` table. If the event exists, we overwrite it.
 * 
 * @async
 * @function
 * @module postDynamoEventMiddleware
 * @param {Object} request HTTP request from frontend.
 * @param [request.body] {Object} - Form Data as an object, parsed by Multer if POST and BodyParser if PATCH (JSON).
 * param [request.package_id] {Integer} - Package ID for Workflow and Dynamo, taken from either Workflow response (POST) or params (PATCH).
 * @param {Object} response HTTP response.
 * @param {Object} next Next function in middleware stack.
 */
async function postDynamoEventMiddleware(request, response, next) {
  // Assumes post/patchWorkflowEventMiddleware has been called before this
  const pid    = request.package_id || +request.params.package_id;
  const evt    = { package_id: pid, ...request.body };
  const result = await EventModel.postEvent(evt);

  // If there was an error return, otherwise pass on the information
  if (result.error) return response.status(400).json(result);
  else {
    request.dynamo_data = result;
    return next();
  };
}


async function patchDynamoEventMiddleware(request, response, next) {
  // Assumes patchWorkflowEventMiddleware has been called before this
  const pid    = +request.params.package_id;
  const evt    = { package_id: pid, ...request.body };
  const result = await EventModel.patchEvent(evt);

  // If there was an error return, otherwise pass on the information
  if (result.error) return response.status(400).json(result);
  else {
    request.dynamo_data = result;
    return next();
  };
}


async function processWorkflowCallback(request, response) {
  let { packageId: package_id, state } = request.body;
  let result;

  console.log(request.body, request.params, request.query);

  if (state === 'COMPLETE') {
    result = await EventModel.patchEvent({ package_id: package_id, approved: 'true'});
  }
  // else if (state === 'VOID')
  // else ROUTING

  // Handle response
  if (result.error) {
    console.log(request.body);
    return response.status(400).json(result);
  }
  else return response.status(200).end();
}


/* DELETE Functions ---------------------------------------------------------*/
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
  getDynamoEventMiddleware,
  getDynamoEventsMiddleware,
  validateEvent,
  postDynamoEventMiddleware,
  patchDynamoEventMiddleware,
  deleteDynamoEventMiddleware,
  processWorkflowCallback
};