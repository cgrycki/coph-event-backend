const rp           = require('request-promise');
const FRONTEND_URI = process.env.FRONTEND_URI;
const WORKFLOW_ENV = process.env.EENV;
const FORM_ID      = process.env.FORM_ID;


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


async function fetchUserPermissions(request, response, next) {
  // Assumes checkSessionExists + retrieveSessionInfo has been run prior to 
  // executing this function. Call comes from our front end.
  const user_ip_address = request.user_ip_address;
  const uiowa_access_token = request.uiowa_access_token;
  
  // Package ID is taken from params
  const { package_id } = request.query;

  // Endpoint
  //GET /workflow/{env}/api/developer/forms/{form_id}/packages/actions?id={package_id}&id={package_id}
  const base_uri = 'https://apps.its.uiowa.edu/workflow';
  const uri = `${base_uri}/workflow/${WORKFLOW_ENV}/api/developer/forms/${FORM_ID}/packages/actions=?id=${package_id}`;
  
  // Workflow headers
  const options = {
    uri     : uri,
    method  : 'GET',
    headers : {
      'Content-Type'        : 'application/json',
      'Accept'              : 'application/vnd.workflow+json;version=1.1',
      'Authorization'       : `Bearer ${uiowa_access_token}`,
      'X-Client-Remote-Addr': user_ip_address
    }
  };

  const { error, data } = await rp(options);
  if (error) response.status(400).json({
    error,
    stack: error.stack,
    message: error.message,
    options
  })
  else {
    request.data = data;
    next();
  };
};


exports.getInboxRedirect     = getInboxRedirect;
exports.fetchUserPermissions = fetchUserPermissions;