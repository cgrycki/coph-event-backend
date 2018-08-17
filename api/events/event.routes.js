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
  fetchUserPermissionsMiddleware,
  postWorkflowEventMiddleware
}                               = require('../workflow/workflow.utils');


/* Parameters + Sessions ----------------------------------------------------*/
router.use(session);
router.use(checkSessionExistsMiddleware);
router.use(retrieveSessionInfoMiddleware);


/* Routes -------------------------------------------------------------------*/
// GET package_id -- Get specific package 
router.get('/:package_id',
  [fetchUserPermissionsMiddleware, getDynamoEventMiddleware],
  (req, res) => res.status(200).json({ evt: req.evt, permissions: req.permissions }));


// GET /my -- Get events filtered by hawkid
router.get('/my', getDynamoEventsMiddleware,
  (req, res) => res.status(200).json(req.evts));


// POST -- Create event in workflow, dynamoDB, and (TODO) Office365
router.post('/',
  [
    multer.fields([]),
    validateEvent,
    postWorkflowEventMiddleware,
    postDynamoEventMiddleware
  ],
  (req, res) => res.status(201).json({ package_id: req.package_id, ...req.body }));


// Get unapproved events
/*
router.get('/unapproved', (req, res) => {
  let { results, error } = EventModel.getEvents("approved", false);
  
  if (error) res.status(400).json({ error: true, message: error.message });
  else res.status(200).json(results);
});
*/

// GET/:date date(s) events
// loggedIn, tokenValid, getEvents, return

// PATCH/:id: Update a given event
// loggedIn, tokenValid, eventExists, isAdmin/hasOwnership, updateDynamoDB, patchOffice365, return

// DELETE/:id: Delete a given event
// loggedIn, tokenValid, eventExists, isAdmin, hasOwnership, deleteDynamoDB, deleteOffice365, return


module.exports = router;