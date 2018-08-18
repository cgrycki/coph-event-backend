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
  postDynamoEventMiddleware
}                               = require('./event.utils');
const {
  getWorkflowPermissionsMiddleware,
  postWorkflowEventMiddleware
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
  (req, res) => res.status(201).json(req.dynamo_response));


// GET /my -- Get events filtered by hawkid
router.get('/my', getDynamoEventsMiddleware,
  (req, res) => res.status(200).json(req.evts));


// GET package_id -- Get specific package 
router.get('/:package_id',
  [getWorkflowPermissionsMiddleware, getDynamoEventMiddleware],
  (req, res) => res.status(200).json({ evt: req.evt, permissions: req.permissions }));


//router.delete('/:package_id', )


// GET/:date date(s) events
// loggedIn, tokenValid, getEvents, return

// PATCH/:id: Update a given event
// loggedIn, tokenValid, eventExists, isAdmin/hasOwnership, updateDynamoDB, patchOffice365, return

// DELETE/:id: Delete a given event
// loggedIn, tokenValid, eventExists, isAdmin, hasOwnership, deleteDynamoDB, deleteOffice365, return


module.exports = router;