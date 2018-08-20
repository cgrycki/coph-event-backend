/** Express Middleware functions to interact with the University of Iowa Workflow servers.
 * @module workflow.utils
 */

const FRONTEND_URI          = process.env.FRONTEND_URI;
const Workflow              = require('./Workflow');
const {
  extractWorkflowInfo,
  shouldUpdateEvent
}                           = require('../utils/');


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
async function getWorkflowPermissionsMiddleware(request, response, next) {
  // From prior middleware
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
      canVoid         : permissions.canVoid,
      canVoidAfter    : permissions.canVoidAfter,
      canSign         : permissions.canSign,
      signatureId     : permissions.signatureId
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
  const { uiowa_access_token, user_ip_address, workflow_data } = request;
  const result = await Workflow.postPackage(
    uiowa_access_token, 
    user_ip_address,
    workflow_data);

  // Either return the error or attach data to the request and pass along
  if (result.error) return response.status(400).json({
    error: result,
    workflow_data: workflow_data
  });
  else {
    request.workflow_response = result;
    request.package_id        = result.actions.packageId;
    return next();
  };
}


/**
 * Deletes an event from workflow, and passes along the package_id to delete in Dynamo.
 * @module deleteWorkflowEventMiddleware
 * @function
 * @async
 * @param {Object} request Incoming HTTP request from frontend.
 * @param {Object} response Outgoing HTTP response object.
 * @param {Object} next Next function in middleware stack (deleteDynamoEvent).
 */
async function deleteWorkflowEventMiddleware(request, response, next) {
  // Gather params from prior middleware for calling RESTful Workflow endpoint.
  const {
    uiowa_access_token: auth_token,
    user_ip_address   : ip,
    params            : { package_id }
  } = request;


  // Ensure we've gathered correct vars
  //return response.status(200).json({ auth_token, ip, package_id });

  // Call and wait for workflow response
  const result = await Workflow.removePackage(auth_token, ip, package_id);

  // Return response if we error out
  if (result.error !== undefined) return response.status(400).json(result);
  else next();
}


/**
 * Middleware conditionally updating Workflow event if data has changed since last POST/update. Otherwise it passes along to the next Middleware
 * @param {Object} request Incoming HTTP Request from frontend.
 * @param {Object} response Outgoing HTTP response.
 * @param {Object} next Next function in Middleware stack. In this case it's usually patchDynamoMiddleware.
 */
async function patchWorkflowEventMiddleware(request, response, next) {
  // Middleware assumes checkSession, retrieveSession, and event validation 
  // and extraction has been succesfully called.

  // Get old + new data from Dynamo and request body, respectively.
  const {
    params            : { package_id },
    uiowa_access_token: auth_token,
    user_ip_address   : ip,
    evt               : dynamo_data,
    workflow_data
  } = request;

  // Get only the portion of data Workflow cares about and test inequality.
  const slim_dynamo_data     = extractWorkflowInfo(dynamo_data);
  const shouldUpdateWorkflow = shouldUpdateEvent(slim_dynamo_data, workflow_data);
  
  // Should we update workflow or just Dynamo?
  if (shouldUpdateWorkflow) {
    const result = await Workflow.updatePackage(auth_token, ip, package_id, slim_workflow_data);

    // Should we continue with the request or was there an error while updating?
    if (result.error) return response.status(400).json(result);
    else {
      response.workflow_response = result;
      return next();
    };
  }
  else return next();
}



module.exports = {
  getInboxRedirect,
  getWorkflowPermissionsMiddleware,
  postWorkflowEventMiddleware,
  deleteWorkflowEventMiddleware,
  patchWorkflowEventMiddleware
};