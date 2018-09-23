/**
 * ExpressJS Route for mounting Workflow specific endpoints.
 * @module workflow/router
 * @requires express
 */

/**
 * @type {object}
 * @const
 * @alias module:workflow/router
 */
const router                      = require('express').Router();
const { getInboxRedirect }        = require('./workflow.utils');
const { processWorkflowCallback } = require('../events/event.utils');



// RESTful functions --------------------------------------------------------*/
/**
 * Updates DynamoDB event entry with current Workflow status
 * @function
 * @name GET/callback
 * @param {object} req Incoming HTTP Request
 * @returns {object}
 */
router.post('/callback', (req, res) => processWorkflowCallback(req, res));
router.patch('/callback', (req, res) => processWorkflowCallback(req, res));
router.put('/callback', (req, res) => processWorkflowCallback(req, res));
router.get('/callback', (req, res) => processWorkflowCallback(req, res));


/**
 * Redirects a Workflow inbox request to our frontend
 * @function
 * @name GET/inbox
 * @param {object} req Incoming HTTP Request
 * @param {object} res Outgoing HTTP response
 * @returns {object}
 */
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
