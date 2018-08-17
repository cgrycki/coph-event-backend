const FRONTEND_URI = process.env.FRONTEND_URI;
const Workflow     = require('./Workflow');


/**
 * Creates a frontend redirect URL from Workflow inbox to frontend for a given package
 * @param {Number} package_id Number denoting Workflow package
 * @param {Number} signature_id Optional number denoting the admin reviewing
 * @returns {string} base_uri URI pointing to our frontend single event page
 */
const getInboxRedirect = (package_id, signature_id=undefined) => {
  // Create our base URL
  let base_uri = `${FRONTEND_URI}/event/${package_id}`;
  if (signature_id !== undefined) return `${base_uri}/${signature_id}`;
  else return base_uri;
};


/**
 * Fetches a JSON object describing User's allowed actions and permissions.
 * @param request {Object} - `request` - HTTP request object containing user information.
 * @param [request.uiowa_access_token] {string} - OAuth token taken from request session.
 * @param [request.user_ip_address] {string} - Originating IP Address of request.
 * @param [request.params.package_id] {Integer} - Package ID taken from /events/:package_id endpoint.
 * @param {Object} response - HTTP response object.
 * @param {Object} next - Next function in middleware stack.
 */
async function fetchUserPermissionsMiddleware(request, response, next) {
  // Assumes checkSessionExists + retrieveSessionInfo has been run prior to 
  // executing this function. Call comes from our front end.
  const auth_token = request.uiowa_access_token;
  const ip_addr    = request.user_ip_address;
  const pid        = request.params.package_id;

  // Call async function
  const permissions = await Workflow.getPermissions(auth_token, ip_addr, pid);
  
  // Check for errors in REST call
  if (permissions.error) return response.status(400).json(permissions);
  // Check permissions from REST response
  else if (!permissions.canView) return response.status(403).json({ 
    error  : true,
    message: "You don't have permissions to view this package."
  });
  // User can view, attach any more permissions to the request
  else {
    request.permissions = { 
      canEdit         : permissions.canEdit,
      canInitiatorVoid: permissions.canInitiatorVoid,
      canVoidAfter    : permissions.canVoidAfter,
      canSign         : permissions.canSign,
      sigantureId     : permissions.sigantureId
    };
    return next();
  };
};


/**
 * Posts a new Workflow package via a Promise. Extracts Auth token and IP address from prior middlewares.
 * @param request {Object} - HTTP request from frontend.
 * @params [request.uiowa_access_token] {string} OAuth token from user's authenticated session.
 * @params [request.user_ip_address] {string} IP Address of request origin.
 * @params [request.body] {Object} Parsed form data for submission.
 * @param {Object} response HTTP response
 * @param {Object} next Next functiont to be called in event route.
 */
async function postWorkflowEventMiddleware(request, response, next) {
  // Assumes multer, checkSession, retrieveSession, validateEvent called

  // Gather params and wait for REST Promise to resolve
  const { uiowa_access_token, user_ip_address, workflow_entry } = request;
  const result = await Workflow.postPackage(
    uiowa_access_token, 
    user_ip_address,
    workflow_entry);

  // Either return the error or attach data to the request and pass along
  if (result.error) return response.status(400).json({
    error: result.error,
    workflow_entry: workflow_entry
  });
  else {
    request.workflow_response = result;
    request.package_id        = result.actions.packageId;
    return next();
  };
}



module.exports = {
  getInboxRedirect,
  fetchUserPermissionsMiddleware,
  postWorkflowEventMiddleware
};