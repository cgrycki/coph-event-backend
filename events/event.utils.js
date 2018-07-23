/**
 * Event Utility Functions
 * A collection of helper functions to be used as middleware in our /events api.
 */

/* Dependencies -------------------------------------------------------------*/
const { check } = require('express-validator/check');
const request   = require('request');
const rp        = require('request-promise');


/* Parameter Utils ----------------------------------------------------------*/
/**
 * textField Validation.
 * @param {string} value The textField value passed to our api.
 * @returns {boolean} 
 */
const validParamTextField = check('textField')
  .exists()
  .isString()
  .isLength({min: 1, max: 50})
  .trim()
  .escape();

/**
 * User Email validation.
 */
const validParamUserEmail = check('userEmail')
  .exists()         // Required
  .isString()       // Formatted correctly
  .isEmail()        // Follows email regex.
  .withMessage('You must have a valid email')
  .trim()           // Remove whitespace
  .normalizeEmail(); // Normalize

/**
 * Validate Event id.
 */
const validParamId = check('id')
  .exists()
  .withMessage('You must include a valid ID')
  .isUUID()
  .escape();


/* Middleware utils ---------------------------------------------------------*/
/**
 * Submits a GET request to workflow for a specified package.
 * Endpoint takes the format: GET /workflow/{env}/api/developer/forms/{form_id}/packages/{package_id}/entry
 */
const getWorkflowEvent = (request, response, next) => {
  let endpoint = process.env.EENV + '/api/developer/forms/' +
    process.env.FORM_ID + '/packages/' + request.params.id +
    'entry';

  // Options from https://workflow.uiowa.edu/help/article/62/7
  let options = {
    method: 'GET',
    uri: '',
    headers: {
      Accept: 'application/vnd.workflow+json;version=1.1',
      Authorization: 'Bearer ' + request.USER_ACCESS_TOKEN,
      'X-Client-Remote-Addr': request.ip
    }
  };
}

/**
 * Submits a workflow routing package.
 * POST submission takes the form of: POST /workflow/{env}/api/developer/forms/{form_id}/packages
 */
const postWorkflowEvent = async (request, response, next) => {
  let endpoint = '/workflow/' + process.env.EENV + '/api/developer/forms/' +
    process.env.FORM_ID + '/packages'

  // Options for our POST request from https://workflow.uiowa.edu/help/article/62/7
  var options = {
    method: 'POST',
    uri: 'https://apps.its.uiowa.edu' + endpoint,
    headers: {
      Accept: 'application/vnd.workflow+json;version=1.1',
      Authorization: 'Bearer ' + request.session.uiowa_access_token,
      'X-Client-Remote-Addr': request.user_ip_address
    },
    body: {
      // REQUIRED by workflow
      state: 'ROUTING',
      subType: null,
      emailContent: null,
      // Form data, all fields REQUIRED or null
      entry: {
        textField: request.params.textField,
        userEmail: request.params.userEmail
      }
    },
    json: true
  };

  await rp(options)
    .then(function (parsedBody) {
        // POST succeeded, pass on the packageId from the response to our save events middleware
        let packageId = parsedBody.id;
        request.packageId = packageId;

        // Add the whole response so we can take a peek
        request.workflowResponse = parsedBody;
        next();
    })
    .catch(function (err) {
        // POST failed...
        response.status(422).json({ 
          err: err, 
          stack: err.stack,
          request: options
        });
    });
};

//const saveEvent = (request, response, next) => {}



exports.validParamTextField = validParamTextField;
exports.validParamUserEmail = validParamUserEmail;
exports.validParamId = validParamId;
exports.postWorkflowEvent = postWorkflowEvent;