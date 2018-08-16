/**
 * Stub for event utils
 */

const EventModel      = require('./event.model');
const { ModelSchema } = require('./event.schema');
const Joi             = require('joi');
const EventSchema     = Joi.object().keys(ModelSchema);


// GET
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