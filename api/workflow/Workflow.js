/**
 * Workflow Helper class.
 */

const rp = require('request-promise');
const { FORM_ID, UIOWA_SECRET_ACCESS_KEY, EENV } = process.env;
const BASE_URI = 'https://apps.its.uiowa.edu/workflow';


class Workflow {
  /**
   * Constructs a new instance of the helper class, configured with environment variables.
   * @param {integer} form_id - Form ID assigned by Workflow.
   * @param {string} app_token - Private OAuth2 key assigned by Workflow.
   * @param {string} env_type - Environment {'test', 'prod'}.
   */
  constructor(form_id, app_token, env_type) {
    this.form_id   = form_id;
    this.app_token = app_token;
    this.env_type  = env_type;
    this.base_uri  = "https://apps.its.uiowa.edu/workflow"
  };


  /**
   * Constructs an URL for Workflow's RESTful API.
   * @param {boolean} tools - Flag indicating if the route should have tools.
   * @returns {string} uri - URI endpoint.
   */
  constructURI(tools=false) {
    const base = `${this.base_uri}/${this.env_type}/api/developer/`;
    const uri = base + ((tools === false) ? '' : 'tools/') +
      `forms/${this.form_id}/packages`;
    return uri;
  }

  /**
   * Executes an asynchronous Promise to the Workflow API.
   * @param {object} options - Request options: uri, method, headers, body
   * @param {function} callback - Optional function to use after request completes. 
   * @returns {object} result - A successful response or error.
   */
  async request(options, callback=undefined) {
    // Create a mutable pointer to hold REST response or error, respectively.
    let result;

    try {
      // Try synchronously calling the REST API.
      result = await rp(options)
        .finally(res => (callback !== undefined) ? callback(res) : res);
    } catch (error) {
      // If we error out, create a meaningful error response
      result = { error: error, message: error.message, stack: error.stack };
    };
    return result;
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
  headers(user_token, ip_address) {
    const headers = {
      'Content-Type'        : 'application/json',
      'Accept'              : 'application/vnd.workflow+json;version=1.1',
      'Authorization'       : `Bearer ${user_token}`,
      'X-Client-Remote-Addr': ip_address,
      'X-App-Authorization' : `${this.app_token}`
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
  async postPackage(user_token, ip_address, data) {
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


  // PATCH package entry


  /**
   * Void a package so that it is no longer routing.
   * @param {string} user_token - User OAuth2 token taken from session.
   * @param {string} ip_address - Originating IP Address taken from request.
   * @param {integer} package_id - Package ID
   * @param {string} voidReason - One of { "DUPLICATE_TRANSACTION", "INCORRECT_FORM", "TRANSACTION_CANCELLED", "TRANSACTION_DENIED" }
   * @returns {object} result - Response object from Workflow if successful or error.
   */
  async voidPackage(user_token, ip_address, package_id, voidReason) {
    const options = {
      method: 'PUT',
      uri: `${this.constructURI(tools=true)}/${package_id}`,
      headers: this.headers(user_token, ip_address),
      body: JSON.stringify({
        id        : package_id,
        state     : 'VOID',
        voidReason: voidReason
      })
    };

    const result = await this.request(options);
    return result;
  }

  // GET packages
  
  // GET:package_id pacakge entry
  

  /**
   * Get user's permissions for a package. Useful for authenticating editing and approval.
   * @param {string} user_token - User OAuth2 token taken from session.
   * @param {string} ip_address - IP Address taken from originating request.
   * @param {integer} package_id - ID of Workflow package to query.
   * @returns {object} result - Allowed user actions, information, and permissions for a given package.
   */
  async getPermissions(user_token, ip_address, package_id) {
    const options = {
      method: 'GET',
      uri: `${this.constructURI()}/actions/id=${package_id}`,
      headers: this.headers(user_token, ip_address)
    };

    let result = await this.request(options);
    return result;
  }
  

  // Validate callback
  async validateCallback(callback) {
    return null;
  }




};

const wf = new Workflow(FORM_ID, UIOWA_SECRET_ACCESS_KEY, EENV);

module.exports = wf;