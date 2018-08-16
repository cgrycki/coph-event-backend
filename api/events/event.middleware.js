/**
 * Stub for event utils
 */

const EventModel      = require('./event.model');
const { ModelSchema } = require('./event.schema');
const Joi             = require('joi');
const EventSchema     = Joi.object().keys(ModelSchema);


// GET
function getDynamoEventMiddleware(request, response, next) {
  // Gather params and make DynamoDB call.
  const package_id = request.body.package_id;
  const evt = EventModel.getEvent(package_id);

  // If EventModel returned an error cut the response short.
  if (evt.error !== undefined) return response.status(400).json(evt);
  else {
    request.evt = evt;
    next();
  };
}
function getDynamoEventsMiddleware(request, response, next) {}


// CREATE
function validateEvent(request, response, next) {}
function postDynamoMiddleware(request, response, next) {}


// UPDATE 
function patchDynamoEventMiddleware(request, response, next) {}


// DELETE
function deleteDynamoEventMiddleware(request, response, next) {}


module.exports = {
  getDynamoEventMiddleware,
  getDynamoEventsMiddleware,
  validateEvent,
  postDynamoMiddleware,
  patchDynamoEventMiddleware,
  deleteDynamoEventMiddleware
};