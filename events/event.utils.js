/**
 * Event Utilities
 */
const rp            = require('request-promise');
const Joi           = require('joi');
const {ModelSchema} = require('./event.schema');
const EventModel    = require('./event.model');
const URI           = process.env.REDIRECT_URI;
const JoiSchema     = Joi.object().keys(ModelSchema);



/**
 * Returns an URL pointing to our Workflow endpoint
 */
function getWorkflowURI() {
  const env_type = process.env.EENV;
  const form_id  = process.env.FORM_ID;
  const base_uri = 'https://apps.its.uiowa.edu';

  const workflowURI = `${base_uri}/workflow/${env_type}/api/developer/forms/${form_id}/packages`;
  return workflowURI;
}


function prepareEvent(request, response, next) {
  /* Prepares form data by setting any empty fields and validating existing fields. */

  // The data parsed from Multer
  let info = { ...request.body };
  
  // Create a Joi object and validate the submitted info
  let { error, value } = Joi.validate(info, JoiSchema);

  if (error !== null) response.status(400).json({ error, value, message: 'PIPELINE IS WORKING' });
  else {
    // Add the extracted workflow inbox information to the request and send along
    request.workflow_entry = {
      approved      : "false",
      date          : info.date,
      setup_required: info.setup_required.toString(),
      user_email    : info.user_email,
      contact_email : info.contact_email,
      room_number   : info.room_number
    };
    next();
  };
}


async function postWorkflowEvent(request, response, next) {
  // Create a Workflow formatted JSON object
  let workflow_data = {
    state       : 'ROUTING',
    subType     : null,
    emailContent: null,
    entry       : request.workflow_entry
  };

  // URI and POST call options
  let options = {
    method  : 'POST',
    uri     : getWorkflowURI(),
    headers : {
      // Workflow accepts JSON
      'Accept'              : 'application/vnd.workflow+json;version=1.1',
      'Content-Type'        : 'application/json',
      // Required to POST an event to workflow
      'Authorization'       : 'Bearer ' + request.uiowa_access_token,
      'X-Client-Remote-Addr': request.user_ip_address
    },
    body                   : JSON.stringify(workflow_data),
    simple                 : false,
    resolveWithFullResponse: true
  };
  
  try {
    // Post the event, and add the event's package ID to the request before we save
    const { responseError, workflow_response } = await rp(options);

    if (responseError) response.status(400).json({ 
      error  : responseError,
      message: responseError.message,
      stack  : responseError.stack,
      options: options,
      stage: 'error in response'
    });
    else {

      // Try extracting the response
      try {
        request.workflow_response = workflow_response;
        request.package_id = workflow_response.actions.package_id;
        next();
      } catch(formatError) {
        response.status(400).json({
          error  : formatError,
          message: formatError.message,
          stack  : formatError.stack,
          options: options,
          stage: 'formatting response'
        });
      };
    };
  } catch(requestError) {
    response.status(400).json({
      error  : requestError,
      message: requestError.message,
      stack  : requestError.stack,
      options: options,
      stage: 'error in request'
    });
  };
}


function postDynamoEvent(request, response, next) {
  /* Saves an event to our DynamoDB after receiving Workflow's response */

  // Combine the form data and the package_id Workflow responded to our POST with
  let package_id = request.package_id;
  let new_event = { package_id, ...request.body };

  try {
    // Create the entry in DynamoDB using our model
    EventModel.create(new_event, (error, data) => {
      if (error) response.status(400).json({ error, new_event });
      else {
        request.dynamo_response = data;
        next();
      };
    });
  } catch(saveError) {
    response.status(400).json({
      error  : saveError,
      stack  : saveError.stack,
      message: saveError.message,
      event  : new_event
    });
  };
}


function getWorkflowEvent(request, response, next) {
  /* TO BE DONE */
};


function getDynamoEvent(request, response, next) {
  /* Gets a single event from DynamoDB */
  let package_id = request.body.package_id;

  EventModel.query(package_id)
    .exec((error, data) => {
      // Return errors if encountered
      if (error) response.status(422).json({ error });

      // Otherwise check if this is a POST request, and return an error if it exists
      else if ((request.method === 'POST') && (data.Items.length !== 0)) response.status(400).json({ error: "Event already exists"});

      // No event found: Return error
      else if (data.Items.length === 0) return response.status(404).json({ error: "Not found"});

      // Exists and we're not trying to create, next middleware!
      else {
        request.item = data.Items[0];
        next();
      };
    });
}

function getDynamoEvents(request, response, next) {
  /* Gets a list of events from DynamoDB for populating dashboards. */
  EventModel.scan()
    .exec((error, data) => {
      if (error) response.status(404).json({ error, stack: error.stack });
      else {
        request.items = data.Items;
        next();
      };
    });
}


/* EXPORTS ------------------------------------------------------------------*/
// POST functions
exports.prepareEvent      = prepareEvent;
exports.postWorkflowEvent = postWorkflowEvent;
exports.postDynamoEvent   = postDynamoEvent;
// GET functions
exports.getDynamoEvent    = getDynamoEvent;
exports.getDynamoEvents   = getDynamoEvents;
