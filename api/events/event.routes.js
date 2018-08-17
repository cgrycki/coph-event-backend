/* Router dependencies ------------------------------------------------------*/
const router      = require('express').Router();
const multer      = require('multer')();
const { session } = require('../auth/auth.session');


/* Created dependencies -----------------------------------------------------*/
const { 
  getDynamoEventMiddleware,
  getDynamoEventsMiddleware,
  validateEvent,
  postDynamoEventMiddleware
} = require('./event.utils');
const {
  fetchUserPermissionsMiddleware,
  postWorkflowEventMiddleware
} = require('../workflow/workflow.utils');

const { 
  checkSessionExistsMiddleware, 
  retrieveSessionInfoMiddleware 
}                         = require('../auth/auth.utils');


/* Parameters + Sessions ----------------------------------------------------*/
router.use(session);
router.use(checkSessionExistsMiddleware);
router.use(retrieveSessionInfoMiddleware);


/* Routes -------------------------------------------------------------------*/
// GET package_id -- Get specific package 
router.get('/:package_id',
  [fetchUserPermissionsMiddleware, getDynamoEventMiddleware],
  (req, res) => res.status(200).json(req.evt));

router.get('/my', getDynamoEventsMiddleware,
  (req, res) => res.status(200).json(req.evts));




// POST -- Create package 
// postOffice365
router.post('/',
  [
    multer.fields([]),
    validateEvent,
    postWorkflowEventMiddleware,
    postDynamoEventMiddleware
  ],
  (request, response) => response.status(201).json({
    message          : "Success!",
    form_id          : process.env.FORM_ID,
    ip               : request.user_ip_address,
    body             : request.body,
    cookies          : request.cookies,
    workflow_entry   : request.workflow_entry,
    workflow_response: request.workflow_response,
    package_id       : request.package_id,
    dynamo_response  : request.dynamo_response
  })
);


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