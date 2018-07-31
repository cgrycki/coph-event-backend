/**
 * Event Utilities
 */
const rp = require('request-promise');

function getWorkflowURI() {
  const env_type = process.env.EENV;
  const form_id  = process.env.FORM_ID;
  const base_uri = 'https://apps.its.uiowa.edu';

  const workflowURI = `${base_uri}/workflow/${env_type}/api/developer/forms/${form_id}/packages`;
  return workflowURI;
}
const URI = process.env.REDIRECT_URI;


// post workflow
async function postWorkflowEvent(request, response, next) {
  // Grab data from the request
  let form_data = request.body;
  let workflow_data = {
    // Required by workflow
    state: 'ROUTING',
    subType: null,
    emailContent: null,
    entry: { ...form_data }
  };

  // Setup uri and POST options
  let options = {
    method: 'POST',
    uri: getWorkflowURI(),
    json: true,
    headers: {
      'Accept'              : 'application/vnd.workflow+json;version=1.1',
      'Authorization'       : 'Bearer ' + request.uiowa_access_token,
      'X-Client-Remote-Addr': request.user_ip_address
    },
    body: workflow_data
  }

  request.workflow_options = options;
  next();
}


exports.postWorkflowEvent = postWorkflowEvent;
/*
rp(options)
  .then(res => JSON.parse(res))
  .then(res => {
    request.workflow_response = res;
    next();
  })
  .catch(err => response.status(400).json(err))
*/