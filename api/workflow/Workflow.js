/**
 * Workflow Helper class.
 */

const rp = require('request-promise');

class Workflow {
  /**
   * Constructs a new instance of the helper class, configured with environment variables.
   */
  constructor() {
    this.form_id       = process.env.FORM_ID;
    this.env_type      = process.env.EENV;
    this.client_id     = process.env.UIOWA_ACCESS_KEY_ID;
    this.client_secret = process.env.UIOWA_SECRET_ACCESS_KEY;
    this.scope         = process.env.UIOWA_SCOPES;
    this.base_uri      = "https://apps.its.uiowa.edu/workflow";
  };
};

/**
 * Create the authentication URL for Workflow application tokens.
 * @returns {string} authURL - Authentication endpoint.
 * 
 * @example
 * 
 * ```
 * POST https://login.uiowa.edu/uip/token.page?
 *     grant_type=client_credentials&
 *     scope=YOUR_APPLICATION_SCOPE&
 *     client_id=YOUR_CLIENT_ID&
 *     client_secret=YOUR_CLIENT_SECRET
 * ```
 */
Workflow.prototype.getAuthURL = function() {
  const authURL = 'https://login.uiowa.edu/uip/token.page?' +
    'grant_type=client_credentials&' +
    `scope=${this.scope}&` +
    `client_id=${this.client_id}&` +
    `client_secret=${this.client_secret}`;

  const config = {
    grant_type: 'client_credentials',
    scope: this.scope,
    client_id: this.client_id,
    client_secret: this.client_secret
  };

  return authURL;
}



/**
 * Constructs an URL for Workflow's RESTful API.
 * @param {boolean} tools - Flag indicating if the route should have tools.
 * @returns {string} uri - URI endpoint.
 */
Workflow.prototype.constructURI = function(tools=false) {
  const base_uri = `${this.base_uri}/${this.env_type}/api/developer/`;
  const uri = base_uri + ((tools === false) ? '' : 'tools/') +
    `forms/${this.form_id}/packages`;

  return uri;
};


/**
 * Executes an asynchronous Promise to the Workflow API.
 * @param {object} options - Request options: uri, method, headers, body
 * @param {function} callback - Optional function to use after request completes. 
 * @returns {object} result - A successful response or error.
 */
Workflow.prototype.request = async function(options) {
  // Create a mutable pointer to hold REST response or error, respectively.
  let error, result;

  try {
    // Try synchronously calling the REST API.
    result = await rp(options);
  } catch (err) {
    // If we error out, create a meaningful error response
    error = { error: err, message: err.message, stack: err.stack };
  };
  return { error, result };
}

/**
 * Creates the formatted authorization headers for a RESTful call to Workflow
 * @param {string} user_token User's OAuth token taken from request's session
 * @param {string} ip_address Request's originating IP address.
 * @returns {object} headers Object with content types and OAuth tokens.
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
Workflow.prototype.headers = function(user_token, ip_address) {
  const headers = {
    'Content-Type'        : 'application/json',
    'Accept'              : 'application/vnd.workflow+json;version=1.1',
    'Authorization'       : `Bearer ${user_token}`,
    'X-Client-Remote-Addr': ip_address,
    'X-App-Authorization' : `${this.client_secret}`
  };

  return headers;
}


/**
 * Creates a Workflow package entry for an event and start routing.
 * @param {string} user_token - User OAuth2 token taken from session.
 * @param {string} ip_address - Originating IP address taken from request.
 * @param {object} data - Package information.
 * @returns {object} result - RESTful Promise result.
 */
Workflow.prototype.postPackage = async function(user_token, ip_address, data) {
  // Create request options
  const options = {
    method: 'POST',
    uri: this.constructURI(),
    headers: this.headers(user_token, ip_address),
    body: JSON.stringify(data)
  };

  // Kick off request
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
 */
Workflow.prototype.voidPackage = async function(user_token, ip_address, package_id, voidReason) {
  const options = {
    method: 'PUT',
    uri    : `${this.constructURI(tools=true)}/${package_id}`,
    headers: this.headers(user_token, ip_address),
    body   : JSON.stringify({
      id        : package_id,
      state     : 'VOID',
      voidReason: voidReason
    })
  };

  const result = await this.request(options);
  return result;
}

/**
 * Remove a package so that it is no longer routing.
 * @param {string} user_token - User OAuth2 token taken from session.
 * @param {string} ip_address - Originating IP Address taken from request.
 * @param {integer} package_id - Package ID
 * @returns {object} result - Response object from Workflow if successful or error.
 */
Workflow.prototype.removePackage = async function(user_token, ip_address, package_id) {
  const options = {
    method: 'PUT',
    uri    : `${this.constructURI(tools=true)}/${package_id}/remove`,
    headers: this.headers(user_token, ip_address)
  };

  const result = await this.request(options);
  return result;
}


/**
 * Get user's permissions for a package. Useful for authenticating editing and approval.
 * @param {string} user_token - User OAuth2 token taken from session.
 * @param {string} ip_address - IP Address taken from originating request.
 * @param {integer} package_id - ID of Workflow package to query.
 * @returns {object} result - Allowed user actions, information, and permissions for a given package.
 */
Workflow.prototype.getPermissions = async function(user_token, ip_address, package_id) {
  const options = {
    method: 'GET',
    uri: `${this.constructURI()}/actions/id=${package_id}`,
    headers: this.headers(user_token, ip_address)
  };

  let result = await this.request(options);
  return result;
}


// Validate callback
Workflow.prototype.validateCallback = async function(callback) {
  return null;
}

// GET packages

// GET:package_id pacakge entry

// PATCH package entry



const wf = new Workflow();
module.exports = wf;