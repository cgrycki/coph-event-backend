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
  
  const table_name = `${app}-${env}-${table}`;
  return table_name;
};


exports.errorFormatter  = errorFormatter;
exports.validateParams  = validateParams;
exports.createTableName = createTableName;