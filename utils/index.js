/**
 * Utility middleware functions for our API.
 */

/* Dependencies -------------------------------------------------------------*/
const { check, validationResult } = require('express-validator/check');


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
 * Creates a table name from three different parts
 * @param {string} app Describes the application client_id
 * @param {string} env Environment: test or prod
 * @param {string} table Which table should we create this for?
 */
const createTableName = (app, env, table) => app +'-'+env+'-'+table;


/**
 * Wrapper for asynchronous promises
 * @param {function} fn Promise function to resolve
 */
const promiseWrapper = fn => (request, response, next) => 
  Promise
    .resolve(fn(request, response, next))
    .catch(next);


exports.errorFormatter  = errorFormatter;
exports.validateParams  = validateParams;
exports.createTableName = createTableName;
exports.promiseWrapper  = promiseWrapper;