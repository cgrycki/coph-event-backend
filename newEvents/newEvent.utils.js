/**
 * Event Utilities
 */
const rp            = require('request-promise');
const Joi           = require('joi');
const {ModelSchema} = require('./newEvent.schema');
const EventModel    = require('./newEvent.model');
const URI           = process.env.REDIRECT_URI;


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

  // The data
  let info = { ...request.body };
  
  // Create a Joi object and validate
  let JoiSchema = Joi.object().keys(ModelSchema);
  let { error, value } = Joi.validate(info, JoiSchema);

  if (error !== null) {
    response.json({ 
      error: JSON.stringify(error), 
      value: JSON.stringify(value), 
      message: 'PIPELINE IS WORKING'
    });
  } else {
    // Add the extracted workflow information to the request and send along
    //request.workflow_info = {...};
    next();
  };
}


async function postWorkflowEvent(request, response, next) {
  // Grab data from the request
  let form_data = request.body;

  // Create a Workflow formatted JSON object
  let workflow_data = {
    state: 'ROUTING',
    subType: null,
    emailContent: null,
    entry: { ...form_data }
    //entry: {select fields here}
  };

  // URI and POST call options
  let options = {
    method  : 'POST',
    uri     : getWorkflowURI(),
    json    : true,
    headers : {
      'Accept'              : 'application/vnd.workflow+json;version=1.1',
      'Authorization'       : 'Bearer ' + request.uiowa_access_token,
      'X-Client-Remote-Addr': request.user_ip_address
    },
    body    : workflow_data
  };


  // STUB FUNCTION, add package_id as a random int
  request.workflow_options = options;
  request.package_id = (Math.floor(Math.random() * (1000 - 1 + 1)) + 1).toString();
  
  /*rp(options)
    .then(res => JSON.parse(res))
    .then(res => {
      request.workflow_response = res;
      next();
    })
    .catch(error => response.status(400).json({ error, workflow_data }))*/
  

  next();
}


async function postDynamoEvent(request, response, next) {
  /* Saves an event to our DynamoDB after receiving Workflow's response */

  // Combine the form data and the package_id Workflow responded to our POST with
  let package_id = request.package_id;
  let new_event = { package_id, ...request.body };

  // Create the entry in DynamoDB using our model
  EventModel.create(new_event, (error, data) => {
    if (error) {
      response.status(400).json({ 
        error,
        new_event
      });
    } else {
      request.dynamo_response = data;
      next();
    };
  });
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
      if (error) response.sendStatus(422).json({ error });

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
      if (error) response.sendStatus(404).json({ error, stack: error.stack });
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
