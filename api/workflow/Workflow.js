/**
 * Workflow Helper class.
 * @module workflow/Workflow
 * @requires request-promise
 */

const rp                  = require('request-promise');
const querystring         = require('querystring');
const { getAppAuthToken } = require('../auth/auth.app');

/**
 * @alias module:workflow/Workflow
 */
class Workflow {
  /**
   * Constructs a new instance of the helper class, configured with environment variables.
   * @class
   */
  constructor() {
    this.form_id       = process.env.FORM_ID;
    this.env_type      = process.env.WF_ENV;
    this.client_id     = process.env.UIOWA_ACCESS_KEY_ID;
    this.client_secret = undefined;
    this.scope         = process.env.UIOWA_SCOPES;
    this.base_uri      = "https://apps.its.uiowa.edu/workflow";
  };
};


/**
 * Retrieves the authentication token for our Workflow app, either by 
 * reading Application session information OR by calling Workflow and
 * setting the token information to a session.
 * 
 * @function
 * @async
 * @returns {string} token - Authentication token.
 */
Workflow.prototype.getAppToken = async function() {
  let token;

  // Check if this object has already called the auth function
  if (this.client_secret === undefined) token = await getAppAuthToken();
  else token = this.client_secret;

  return token;
}


/**
 * Constructs an URL for Workflow's RESTful API.
 * @param {boolean} tools - Flag indicating if the route should have tools.
 * @returns {string} uri - URI endpoint.
 * 
 * @example
 * 
 * ```
 * Workflow.constructURI() => 
 * 'https://apps.its.uiowa.edu/workflow/test/api/developer/forms/6025/packages'
 * 
 * Workflow.constructURI(tools=true) => 
 * 'https://apps.its.uiowa.edu/workflow/test/api/developer/tools/forms/6025/packages/1111111/entry'
 * ```
 */
Workflow.prototype.constructURI = function(tools=false) {
  const base_uri = `${this.base_uri}/${this.env_type}/api/developer/`;
  const uri = base_uri + ((tools === false) ? '' : 'tools/') +
    `forms/${this.form_id}/packages`;

  return uri;
};

/**
 * Returns a URI query for package ID(s).
 * @param {number[]}
 * @returns {string} queryString String to tack onto the Workflow permissions URI.
 * 
 * @example
 * 
 * ```
 * constructPermissionsURI(1) => 'id=1';
 * 
 * constructPermissionsURI([1, 2, 3]) => 'id=1&id=2&id=3;
 * ```
 */
Workflow.prototype.constructPermissionsURI = function(pidOrPids) {
  const queryString = querystring.stringify({ id: pidOrPids });
  return queryString;
}


/**
 * Executes an asynchronous Promise to the Workflow API.
 * @function
 * @async
 * @param {object} options - Request options: uri, method, headers, body
 * @param {function} callback - Optional function to use after request completes. 
 * @returns {Promise}
 * @fufill {object} Successful response from Workflow REST call.
 * @reject {object} Error message and stack.
 */
Workflow.prototype.request = async function(options) {
  // Create a mutable pointer to hold REST response or error, respectively.
  let response;

  try {
    // Try synchronously calling the REST API.
    response = await rp(options);
  } catch (err) {
    // If we error out, create a meaningful error response
    response = { error: true, message: err.message, stack: err.stack };
  };
  return response;
}


/**
 * Creates the formatted authorization headers for a RESTful call to Workflow
 * @param {string} user_token User's OAuth token taken from request's session
 * @param {string} ip_address Request's originating IP address.
 * @returns {object} headers Object with content types and OAuth tokens.
 * 
 * @async
 * 
 * @example
 * 
 * From the Workflow documentation:
 * ```
 * Accept: application/vnd.workflow+json;version=1.1
 * Authorization: Bearer USER_ACCESS_TOKEN --OR-- APPLICATION_ACCESS_TOKEN
 * X-App-Authorization: Bearer APPLICATION_ACCESS_TOKEN
 * X-Client-Remote-Addr: USER_IP_ADDRESS
 * ```
 */
Workflow.prototype.headers = async function(user_token, ip_address) {
  const app_token = await this.getAppToken();

  const headers = {
    'Content-Type'        : 'application/json',
    'Accept'              : 'application/vnd.workflow+json;version=1.1',
    'Authorization'       : `Bearer ${user_token}`,
    'X-Client-Remote-Addr': ip_address,
    'X-App-Authorization' : `Bearer ${app_token}`
  };

  return headers;
}


/**
 * Creates a Workflow package entry for an event and start routing.
 * @param {string} user_token - User OAuth2 token taken from session.
 * @param {string} ip_address - Originating IP address taken from request.
 * @param {object} data - Package information.
 * @returns {object} result - RESTful Promise result.
 * 
 * @async
 * 
 * @example
 * 
 * Example Success response:
 * ```
 * {
 *   "id" : 2,
 *   "state" : "ROUTING",
 *   "subType" : null,
 *   "emailContent" : {
 *     "packageDetails" : "<h3>My Custom HTML for the Approver Notification Email</h3>"
 *   },
 *   "actions" : {
 *     "canView" : true,
 *     "canEdit" : true,
 *     "canSign" : true,
 *     "canVoid" : true,
 *     "canInitiatorVoid" : false,
 *     "canAddApprover" : true,
 *     "canVoidAfter" : false,
 *     "packageId" : 2,
 *     "signatureId" : 2
 *   },
 *   "routingDate" : "2015-04-20T16:46:37",
 *   "actionDate" : null,
 *   "initiator" : {
 *     "id" : 9,
 *     "displayName" : "Briggs, Ransom",
 *     "hrdeptdesc" : null,
 *     "collegeName" : null,
 *     "personType" : null,
 *     "title" : null,
 *     "univid" : "00028152",
 *     "email" : "ransom-briggs@uiowa.edu",
 *     "campusPostalAddress" : null,
 *     "officePhone" : null
 *   },
 *   "voidReason" : null,
 *   "commentCount" : 0,
 *   "attachmentCount" : 0
 * }
 * ```
 */
Workflow.prototype.postPackage = async function(user_token, ip_address, data) {
  // Create POST data for Workflow package entry
  const workflow_data = {
    state       : 'ROUTING',
    subType     : null,
    emailContent: null,
    entry       : data
  };
  
  // Create request options
  const options = {
    method : 'POST',
    uri    : this.constructURI(),
    headers: await this.headers(user_token, ip_address),
    json   : true,
    body   : workflow_data
  };

  // Make the request to Workflow
  const result = await this.request(options);
  return result;
}


/**
 * Updates an Event package entry in Workflow. 
 * @param {string} user_token OAuth token taken from session store.
 * @param {string} ip_address IP address of originating request.
 * @param {Object} data Extracted information from user Event update.
 * @returns {Object} Response from Workflow.
 * 
 * @async
 * 
 * @example
 * 
 * ```
 * URI: PUT https://apps.its.uiowa.edu/workflow/prod/api/developer/tools/forms/1/packages/2/entry
 * 
 * BODY: {
 *   "entry" : {
 *     "age" : 70.0,
 *     "name" : "Al Pacino"
 *   },
 *   "sendDeltaEmail" : null,
 *   "emailContent" : {
 *     "deltaSummary" : "<h3>My custom HTML for the edit email</h3>",
 *     "packageDetails" : "<h3>My Custom HTML for the approver notification email</h3>"
 *   }  
 * }
 * 
 * RESPONSE: Reflects body if successful
 * ```
 */
Workflow.prototype.updatePackage = async function(user_token, ip_address, package_id, data) {
  // Create a body for the update
  const workflow_data = {
    entry         : data,
    sendDeltaEmail: false,
    emailContent  : {
      deltaSummary  : null,
      packageDetails: null
    }
  };

  // Create options for the REST call
  const options = {
    method : 'PUT',
    uri    : `${this.constructURI(tools=true)}/${package_id}/entry`,
    headers: await this.headers(user_token, ip_address),
    json   : true,
    body   : workflow_data
  };


  const result = await this.request(options);
  return result;
}


/**
 * Void a package so that it is no longer routing.
 * @param {string} user_token - User OAuth2 token taken from session.
 * @param {string} ip_address - Originating IP Address taken from request.
 * @param {integer} package_id - Package ID
 * @param {string} voidReason - One of { "DUPLICATE_TRANSACTION", "INCORRECT_FORM", "TRANSACTION_CANCELLED", "TRANSACTION_DENIED" }
 * @returns {object} result - Response object from Workflow if successful or error.
 * 
 * @async
 */
Workflow.prototype.voidPackage = async function(user_token, ip_address, package_id, voidReason) {
  const options = {
    method : 'PUT',
    uri    : `${this.constructURI(tools=true)}/${package_id}`,
    headers: await this.headers(user_token, ip_address),
    json   : true,
    body   : {
      id        : package_id,
      state     : 'VOID',
      voidReason: voidReason
    }
  };

  const result = await this.request(options);
  return result;
}

/**
 * Remove a package so that it is no longer routing.
 * 
 * @async
 * @param {string} user_token - User OAuth2 token taken from session.
 * @param {string} ip_address - Originating IP Address taken from request.
 * @param {integer} package_id - Package ID
 * @returns {object} result - Response object from Workflow if successful or error.
 * 
 * @example
 * 
 * ```
 * PUT https://apps.its.uiowa.edu/workflow/prod/api/developer/tools/forms/1/packages/8/remove
 * ==>
 * {
 *   "id" : 8,
 *   "state" : "PRE_ROUTING",
 *   "voidReason" : null,
 *   "actions" : {
 *     "canView" : true,
 *     "canEdit" : true,
 *     "canSign" : false,
 *     "canVoid" : false,
 *     "canInitiatorVoid" : false,
 *     "canAddApprover" : false,
 *     "canVoidAfter" : false,
 *     "packageId" : 8,
 *     "signatureId" : null
 *   },
 *   "subType" : null,
 *   "emailContent" : {
 *     "packageDetails" : null
 *   },
 *   "routingDate" : "2015-04-20T16:46:42",
 *   "actionDate" : null,
 *   "initiator" : {
 *     "id" : 9,
 *     "displayName" : "Briggs, Ransom",
 *     "hrdeptdesc" : null,
 *     "collegeName" : null,
 *     "personType" : null,
 *     "title" : null,
 *     "univid" : "00028152",
 *     "email" : "ransom-briggs@uiowa.edu",
 *     "campusPostalAddress" : null,
 *     "officePhone" : null
 *   },
 *   "commentCount" : 0,
 *   "attachmentCount" : 0
 * }
 * ```
 */
Workflow.prototype.removePackage = async function(user_token, ip_address, package_id) {
  const options = {
    method         : 'PUT',
    uri            : `${this.constructURI(tools=true)}/${package_id}/remove`,
    headers        : await this.headers(user_token, ip_address),
    withCredentials: true,
    json           : true
  };

  const result = await this.request(options);
  return result;
}


/**
 * Get user's permissions for a package. Useful for authenticating editing and approval.
 * 
 * @async
 * @param {string} user_token - User OAuth2 token taken from session.
 * @param {string} ip_address - IP Address taken from originating request.
 * @param {integer} package_id - ID of Workflow package to query.
 * @returns {object} result - Allowed user actions, information, and permissions for a given package.
 * 
 * @example
 * 
 * Endpoint and response:
 * ```
 * GET /workflow/{env}/api/developer/forms/{form_id}/packages/actions?id={package_id}&id={package_id}
 *   =>
 * [ {
 *  "canView" : true,
 *  "canEdit" : false,
 *  "canSign" : false,
 *  "canVoid" : false,
 *  "canInitiatorVoid" : false,
 *  "canAddApprover" : false,
 *  "canVoidAfter" : false,
 *  "packageId" : 17,
 *  "signatureId" : null
 * }, {
 *  "canView" : true,
 *  "canEdit" : true,
 *  "canSign" : true,
 *  "canVoid" : true,
 *  "canInitiatorVoid" : false,
 *  "canAddApprover" : true,
 *  "canVoidAfter" : false,
 *  "packageId" : 18,
 *  "signatureId" : 40
 * } ]
 * ```
 */
Workflow.prototype.getPermissions = async function(user_token, ip_address, package_id_or_ids) {
  // Create a query using a helper function
  const queryString = this.constructPermissionsURI(package_id_or_ids);

  const options = {
    method : 'GET',
    json   : true,
    uri    : `${this.constructURI()}/actions?${queryString}`,
    headers: await this.headers(user_token, ip_address)
  };

  let result = await this.request(options);
  return result;
}


// Unfreeze routing after callback
// DELETE https://apps.its.uiowa.edu/workflow/{env}/api/developer/forms/{form_id}/packages/{package_id}/notification_locks/{lock_id}



/**
 * @todo
 * Validate callback
 * 
 * 
 * @example
 * 
 * Sample Callback: 
 * ```
 * {
 *   "@class" : "developer",
 *   "formId" : 100,
 *   "packageId" : 1285,
 *   "state" : "COMPLETE",
 *   "createdAt" : "2016-02-24T17:04:48",
 *   "stop" : null,
 *   "lockId" : 123456,
 *   "entry" : {
 *     "field_1_naturalKey" : "field_1_value",
 *     "field_2_naturalKey" : "field_2_value",
 *     "field_3_naturalKey" : "field_3_value",
 *     "field_4_naturalKey" : "field_4_value",
 *     "field_5_naturalKey" : "field_5_value"
 *   }
 * }```
 */
Workflow.prototype.validateCallback = async function(access_token) {

  

  return null;
}



module.exports = new Workflow();