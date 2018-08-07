/**
 * [FROM WORKFLOW](https://workflow.uiowa.edu/help/article/37/6)
 *  User can sign package:
 *      {form_approver_url}?form_id={form_id}&package_id={package_id}&signature_id={signature_id}
 *  User Can't sign package:
 *      {form_approver_url}?form_id={form_id}&package_id={package_id}
 *  Example:
 *      https://hristest.its.uiowa.edu/absence-request/inbox?form_id=1&package_id=10007500&signature_id=124870
 */

/* Router dependencies ------------------------------------------------------*/
const express      = require('express');
var   router       = express.Router();
const { 
  getInboxRedirect 
}                  = require('./inbox.utils');


/* RESTful functions --------------------------------------------------------*/
 router.get('/', (request, response) => {
  // Grab query params from workflow call
  let { pacakge_id, signature_id } = request.params;
  
  // Create specific event URL from query params
  let event_uri = getInboxRedirect(pacakge_id, signature_id);

  // Redirect the response to our frontend
  response.status(200).redirect(event_uri);
 });


module.exports = router;
