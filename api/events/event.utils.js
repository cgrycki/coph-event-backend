/**
 * Event Utilities
 */


/* Dependencies -------------------------------------------------------------*/
const EventModel      = require('./event.model');
const { ModelSchema } = require('./event.schema');
const Joi             = require('joi');
const EventSchema     = Joi.object().keys(ModelSchema);


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
  const evt = await EventModel.getEvent(package_id);

  // If EventModel returned an error cut the response short.
  if (evt.error !== undefined) return response.status(400).json(evt);
  
  // If EventModel didn't find anything, return
  if (evt.length === 0) return response.status(404).json({ message: 'couldnt find that'});
  
  // Otherwise we found the event object, convert 'approval' from base64 > bool
  // "dHJ1ZQ==" ('true')        "ZmFsc2U=" (false)
  else {
    // Some of our objects are still using booleans (woof)
    if (typeof(evt[0].approval) !== "boolean") {
      evt[0].approval = (evt[0].approval === "dHJ1ZQ==") ? true : false;
    };

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
  const result = await EventModel.getEvents(field, value);

  if (result.error !== undefined) return response.status(400).json({
    error : true,
    result: result,
    path  : request.path,
    field : field,
    value : value
  });
  else {
    request.evts = result;
    return next();
  };
}



/* POST Functions -----------------------------------------------------------*/
/**
 * Validates the potential Event information in a POST request.  
 * @param {Object} request HTTP request containing form data.
 * @param [request.body] {Object} - Form Data as an object, parsed by Multer.
 * @param {Object} response HTTP response
 * @param {Object} next Next function in middleware stack.
 */
function validateEvent(request, response, next) {
  // Gather the form information parsed by Multer. Then validate with Joi.
  let form_info = { ...request.body };
  let { error, valid_info } = Joi.validate(form_info, EventSchema);

  // If there's any invalid fields, return with information
  if (error !== null) return response.status(400).json({ error, valid_info });
  // Otherwise, create a Workflow entry (slimmed down information for inbox)
  else {
    request.workflow_entry = {
      approved      : "false",
      date          : form_info.date,
      setup_required: form_info.setup_required.toString(),
      user_email    : form_info.user_email,
      contact_email : form_info.contact_email,
      room_number   : form_info.room_number
    };
    return next();
  };
}


/**
 * Asynchronously creates an event object in DynamoDB `events` table.
 * 
 * @async
 * @module postDynamoEventMiddleware
 * @function
 * @param {Object} request HTTP request from frontend.
 * @param [request.body] {Object} - Form Data as an object, parsed by Multer.
 * @param {Object} response HTTP response.
 * @param {Object} next Next function in middleware stack.
 */
async function postDynamoEventMiddleware(request, response, next) {
  // Assumes postWorkflowEventMiddleware has been called before this
  const evt = { package_id: request.package_id, ...request.body };
  const result = await EventModel.postEvent(evt);

  // If there was an error return, otherwise pass on the information
  if (result.error) return response.status(400).json(result);
  else {
    request.dynamo_response = result;
    return next();
  };
}


/* PATCH Functions ----------------------------------------------------------*/
function patchDynamoEventMiddleware(request, response, next) {}


/* DELETE Functions ---------------------------------------------------------*/
async function deleteDynamoEventMiddleware(request, response, next) {
  // Get hashKey of dynamo object
  let { package_id } = request.params;
  
  // Wait for dynamoDB to destroy object
  let result = await EventModel.deleteEvent(package_id);

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
  deleteDynamoEventMiddleware
};