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


async function fetchUserPermissionsMiddleware(request, response, next) {
  // Assumes checkSessionExists + retrieveSessionInfo has been run prior to 
  // executing this function. Call comes from our front end.
  const auth_token = request.uiowa_access_token;
  const ip_addr    = request.user_ip_address;
  const pid        = request.body.package_id;

  // Call async function
  const permissions = await Workflow.getPermissions(auth_token, ip_addr, pid);
  
  // Check for errors
  if (permissions.error) return response.status(400).json(permissions);
  else {
    request.permissions = permissions;
    next();
  };
};


async function postWorkflowEventMiddleware(request, response, next) {
  // Assumes multer, checkSession, retrieveSession, validateEvent called

  // Gather params and wait for REST Promise to resolve
  const { uiowa_access_token, user_ip_address, workflow_entry } = request;
  const result = await Workflow.postPackage(
    uiowa_access_token, 
    user_ip_address,
    workflow_entry);

  return response.status(200).json(result);

  /* Either return the error or attach data to the request and pass along
  if (result.error) return response.status(400).json({
    result: error,
    workflow_entry: workflow_entry
  });
  else {
    request.workflow_response = result;
    request.package_id        = result.actions.packageId;
    return next();
  };*/
}



module.exports = {
  getInboxRedirect,
  fetchUserPermissionsMiddleware,
  postWorkflowEventMiddleware
};