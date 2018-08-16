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
const router      = require('express').Router();
const { 
  getInboxRedirect
}                  = require('./workflow.utils');
const Workflow     = require('./Workflow');
const {
  checkSessionExistsMiddleware,
  retrieveSessionInfoMiddleware
}                  = require("../auth/auth.utils");


/* RESTful functions --------------------------------------------------------*/
// GET: forward workflow inbox redirect to frontend
router.get('/inbox', (request, response) => {
  // Grab query params from workflow call
  const package_id   = request.query.packageId;
  const signature_id = request.query.signatureId;

  // Create specific event URL from query params
  let event_uri = getInboxRedirect(package_id, signature_id);

  // Redirect the response to our frontend
  response.status(200).redirect(event_uri);
});


// DELETE package
router.delete('/:package_id', 
  checkSessionExistsMiddleware, retrieveSessionInfoMiddleware,
  (req, res) => {
    // Gather params for calling RESTful Workflow endpoint
    const uiowa_access_token = req.uiowa_access_token;
    const user_ip_address    = req.user_ip_address;
    const package_id         = req.params.package_id;

    // Wait for the workflow call
    /*const result = await Workflow.removePackage(uiowa_access_token, user_ip_address, package_id);
    if (result.error) res.status(400).json(result);
    else res.status(200).json(result);
    */
    res.status(200).json({ 
      ip: user_ip_address, 
      pid: package_id 
    });
  });

// TESTING
router.get('/token', async (req, res) => {
  try {
    let token = await Workflow.getAppToken();
    res.status(200).json(token);
  } catch (err) {
    res.status(400).json({
      message: err.message,
      stack: err.stack
    });
  }
});




// CALLBACK ROUTE



module.exports = router;
