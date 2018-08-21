/**
 * Utilty functions shared by our API routes.
 */
/* Dependencies -------------------------------------------------------------*/
const { validationResult } = require('express-validator/check');


/* Utilities ----------------------------------------------------------------*/
/**
 * Formates express-validator errors gracefully.
 * @param {validationResult} error Return value from express-validator's 
 * validationResult() function. 
 */
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  // Create human readable strings for our errors.
  return `${location}[${param}]: ${msg}`;
}


/**
 * Ensures an incoming HTTP request has passed all parameter validations.
 * @param {XMLHttpRequest} request Incoming HTTP request passed by Express serv.
 * @param {XMLHttpRequest} response HTTP response sent to client.
 * @param {Function} next Next function to run, if there are no errors.
 */
const validateParams = (request, response, next) => {
  // Gather errors accumulated from prior middleware.
  const errors = validationResult(request).formatWith(errorFormatter);

  // If we have any errors, stop routing and return them in HTTP response.
  if (!errors.isEmpty()) {
    // Response will contain something like
    // { errors: [ "body[password]: must be at least 10 chars long" ] }
    return response.status(400).json({ errors: errors.array() });
  };

  // We have no errors! Move on to the next function in our middleware.
  next();
};


/**
 * Creates a table name from our environment and a table param.
 * @param {string} table Which table should we create this for?
 * @returns {string} table_name Formatted DynamoDB table name for our environment.
 */
const createTableName = (table) => {
  // Describes the application client_id and name from our schema
  let app = process.env.UIOWA_ACCESS_KEY_ID;

  // Environment: {test, dev, prod}
  let env = process.env.WF_ENV;
  
  const table_name = `${app}-${table}-${env}`;
  return table_name;
};


/**
 * Extracts submitted data from an User's event for their Workflow entry.
 * @param {Object} form_info Form Data submitted via a user's POST request.
 * @returns {Object} Workflow information: a subset of total information *required* for Workflow's inbox.
 */
const extractWorkflowInfo = (form_info) => ({
  approved      : form_info.approved,
  date          : form_info.date,
  setup_required: form_info.setup_required.toString(),
  user_email    : form_info.user_email,
  contact_email : form_info.contact_email,
  room_number   : form_info.room_number
});


/**
 * Deep compares two objects' properties and returns a boolean if they are inequal.
 * @param {Object} old_data Old event info data from DynamoDB and slimmed down.
 * @param {Object} new_data New event info data from user update.
 * @returns {boolean} Indicates equality of objects.
 */
const shouldUpdateEvent = (old_data, new_data) => {
  for (var key in old_data) {
    // If dynamo object has key and new object doesn't, they are inequal
    if (!(key in new_data)) return true;

    // If any of the objects properties are different, return true
    if (old_data[key] !== new_data[key]) return true;
  };

  // Otherwise we made it through all object keys, objects are functionally same
  return false;
};



module.exports = {
  errorFormatter,
  validateParams,
  createTableName,
  extractWorkflowInfo,
  shouldUpdateEvent
};