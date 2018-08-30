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
const router                      = require('express').Router();
const { getInboxRedirect }        = require('./workflow.utils');
const { processWorkflowCallback } = require('../events/event.utils');



/* RESTful functions --------------------------------------------------------*/
// POST /callback -- Process Workflow package change
router.post('/callback', (req, res) => processWorkflowCallback(req, res));
router.patch('/callback', (req, res) => processWorkflowCallback(req, res));
router.put('/callback', (req, res) => processWorkflowCallback(req, res));
router.get('/callback', (req, res) => processWorkflowCallback(req, res));



// GET: forward workflow inbox redirect to frontend
router.get('/inbox', (req, res) => {
  // Grab query params from workflow call
  const package_id   = req.query.packageId;
  const signature_id = req.query.signatureId;

  // Create specific event URL from query params
  let event_uri = getInboxRedirect(package_id, signature_id);

  // Redirect the response to our frontend
  res.status(200).redirect(event_uri);
});



module.exports = router;
