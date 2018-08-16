/**
 * Stub for event utils
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
  else {
    request.evt = evt;
    next();
  };
}

/* Might be better served with dedicated endpoints
  /unapproved
  /date
  /user
*/
async function getDynamoEventsMiddleware(request, response, next) {}


/* POST Functions -----------------------------------------------------------*/
/**
 * Validates the potential Event information in a POST request.  
 * @param {Object} request HTTP request containing form data.
 * @param {Object} response HTTP response
 * @param {Object} next Next function in middleware stack.
 */
function validateEvent(request, response, next) {
  // Gather the form information parsed by Multer.
  let form_info = { ...request.body };

  // Validate using Joi
  let { error, valid_info } = Joi.validate(form_info, EventSchema);

  // If there's any invalid fields, return with information
  if (error !== null) return response.status(400).json({ error, valid_info });
  // Otherwise, create a Workflow entry (slimmed down information for inbox)
  else {
    request.workflow_entry = {
      approved      : "false",
      date          : form_info.date,
      setup_required: info.setup_required.toString(),
      user_email    : form_info.user_email,
      contact_email : form_info.contact_email,
      room_number   : form_info.room_number
    };
    next();
  };
}


/**
 * Asynchronously creates an event object in DynamoDB `events` table.
 * 
 * @async
 * @module postDynamoEventMiddleware
 * @function
 * @param {Object} request HTTP request; should contain form data
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
    next();
  }
}


/* PATCH Functions ----------------------------------------------------------*/
function patchDynamoEventMiddleware(request, response, next) {}


/* DELETE Functions ---------------------------------------------------------*/
function deleteDynamoEventMiddleware(request, response, next) {}


module.exports = {
  getDynamoEventMiddleware,
  getDynamoEventsMiddleware,
  validateEvent,
  postDynamoEventMiddleware,
  patchDynamoEventMiddleware,
  deleteDynamoEventMiddleware
};