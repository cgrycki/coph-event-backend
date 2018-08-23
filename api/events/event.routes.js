/* Router dependencies ------------------------------------------------------*/
const router      = require('express').Router();
const multer      = require('multer')();
const { session } = require('../auth/auth.session');


/* Middlewares  -------------------------------------------------------------*/
const { 
  checkSessionExistsMiddleware, 
  retrieveSessionInfoMiddleware 
}                               = require('../auth/auth.utils');
const { 
  getDynamoEventMiddleware,
  getDynamoEventsMiddleware,
  validateEvent,
  postDynamoEventMiddleware,
  deleteDynamoEventMiddleware
}                               = require('./event.utils');
const {
  getWorkflowPermissionsMiddleware,
  postWorkflowEventMiddleware,
  deleteWorkflowEventMiddleware,
  patchWorkflowEventMiddleware
}                               = require('../workflow/workflow.utils');


/* Parameters + Sessions ----------------------------------------------------*/
router.use(session);
router.use(checkSessionExistsMiddleware);
router.use(retrieveSessionInfoMiddleware);


/* Routes -------------------------------------------------------------------*/
// POST -- Create event in workflow, dynamoDB, and (TODO) Office365
router.post('/',
  [
    multer.fields([]),
    validateEvent,
    postWorkflowEventMiddleware,
    postDynamoEventMiddleware
  ],
  (req, res) => res.status(201).json(req.dynamo_data));


// GET /my -- Get events filtered by hawkid
router.get('/my', getDynamoEventsMiddleware, //getWorkflowPermissionsMiddleware,
  (req, res) => res.status(200).json(req.evts));


// GET package_id -- Get specific package 
router.get('/:package_id',
  [getWorkflowPermissionsMiddleware, getDynamoEventMiddleware],
  (req, res) => res.status(200).json({ evt: req.evt, permissions: req.permissions }));


// DELETE package_id -- Delete a event in Workflow and DynamoDB
// loggedIn, tokenValid, eventExists, isAdmin, hasOwnership, deleteDynamoDB, deleteOffice365, return
router.delete('/:package_id',
  [deleteWorkflowEventMiddleware, deleteDynamoEventMiddleware],
  (req, res) => res.status(200).json({ package_id: req.params.package_id }));


// PATCH/:package_id -- Update a given event
router.patch('/:package_id', 
  [
    validateEvent,
    getDynamoEventMiddleware,
    patchWorkflowEventMiddleware,
    postDynamoEventMiddleware
  ], (req, res) => res.status(200).json(req.dynamo_data));


module.exports = router;