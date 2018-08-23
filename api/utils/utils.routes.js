/**
 * Utility routes
 * For operating on API endpoints.
 */

/* Router dependencies ------------------------------------------------------*/
const router      = require('express').Router();
const { session } = require('../auth/auth.session');
const {
  checkSessionExistsMiddleware,
  retrieveSessionInfoMiddleware
}                 = require("../auth/auth.utils");
const {
  deleteWorkflowEventMiddleware
}                 = require("../workflow/workflow.utils");
const {
  deleteDynamoEventMiddleware
}                 = require("../events/event.utils");


/* Router Authentication ----------------------------------------------------*/
router.use(session);
router.use(checkSessionExistsMiddleware);
router.use(retrieveSessionInfoMiddleware);


/* RESTful functions --------------------------------------------------------*/
// DELETE Workflow package
router.delete('/workflow/:package_id', deleteWorkflowEventMiddleware,
  (req, res) => res.status(200).json({ package_id: req.params.pacakge_id }));


// DELETE Dynamo entry
router.delete("/dynamo/:package_id", deleteDynamoEventMiddleware,
  (req, res) => res.status(200).json({ package_id: req.params.package_id }));



module.exports = router;