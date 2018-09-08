/* Router dependencies ------------------------------------------------------*/
const router      = require('express').Router();
const { session } = require('../auth/auth.session');


/* Middlewares  -------------------------------------------------------------*/
const {
  checkSessionExistsMiddleware,
  retrieveSessionInfoMiddleware
}                               = require('../auth/auth.utils');
const {
  validateEvent,
  getDynamoEventMiddleware,
  getDynamoEventsMiddleware,
  postDynamoEventMiddleware,
  patchDynamoEventMiddleware,
  deleteDynamoEventMiddleware
}                               = require('./event.utils');
const {
  getWorkflowPermissionsMiddleware,
  postWorkflowEventMiddleware,
  deleteWorkflowEventMiddleware,
  patchWorkflowEventMiddleware
}                               = require('../workflow/workflow.utils');
const {
  validateLayout,
  getLayoutMiddleware,
  getLayoutsMiddleware,
  postLayoutMiddleware,
  patchLayoutMiddleware,
  deleteLayoutMiddleware
}                               = require('../layouts/layout.utils');


/* Parameters + Sessions ----------------------------------------------------*/
router.use(session);
router.use(checkSessionExistsMiddleware);
router.use(retrieveSessionInfoMiddleware);


/* Routes -------------------------------------------------------------------*/
// POST -- Create event in workflow, dynamoDB, and (TODO) Office365
router.post('/',
  validateEvent,
  postWorkflowEventMiddleware,
  postDynamoEventMiddleware,
  validateLayout,
  postLayoutMiddleware,
  (req, res) => res.status(201).json({ 
    event      : req.dynamo_data,
    permissions: req.permissions,
    items      : req.items
  }));


// GET /my -- Get events filtered by hawkid
router.get('/my',
  getDynamoEventsMiddleware,
  getWorkflowPermissionsMiddleware,
  getLayoutsMiddleware,
  (req, res) => res.status(200).json(req.events));


// GET package_id -- Get specific package 
router.get('/:package_id',
  getWorkflowPermissionsMiddleware,
  getDynamoEventMiddleware,
  getLayoutMiddleware,
  (req, res) => res.status(200).json({
    event      : req.event,
    permissions: req.permissions,
    items      : req.items
  }));


// DELETE package_id -- Delete a event in Workflow and DynamoDB
// loggedIn, tokenValid, eventExists, hasOwnership, deleteDynamoDB, deleteOffice365, return
router.delete('/:package_id',
  deleteWorkflowEventMiddleware,
  deleteDynamoEventMiddleware,
  deleteLayoutMiddleware,
  (req, res) => res.status(200).json({ package_id: req.params.package_id }));


// PATCH/:package_id -- Update a given event
router.patch('/:package_id',
  validateEvent,
  getDynamoEventMiddleware,
  patchWorkflowEventMiddleware,
  getWorkflowPermissionsMiddleware,
  patchDynamoEventMiddleware,
  validateLayout,
  getLayoutMiddleware,
  patchLayoutMiddleware,
  (req, res) => res.status(200).json({
    event      : req.dynamo_data,
    permissions: req.permissions,
    items      : request.items
  }));


module.exports = router;