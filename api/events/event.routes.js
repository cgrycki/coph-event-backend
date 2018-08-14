/* Router dependencies ------------------------------------------------------*/
const router = require('express').Router();
const multer  = require('multer')();


/* Created dependencies -----------------------------------------------------*/
const { 
  prepareEvent,
  postWorkflowEvent,
  postDynamoEvent,
  getDynamoEvent,
  getDynamoEvents
}                         = require('./event.utils');
const EventModel          = require('./event.model');
const { 
  checkSessionExists, 
  retrieveSessionInfo 
}                         = require('../auth/auth.utils');


/* Routes -------------------------------------------------------------------*/

// GET /: retrieves list of events from dynamo
// loggedIn, tokenValid, isAdmin, return
router.get('/', getDynamoEvents, (req, res) => res.status(200).json(req.items));


// Get specific package
router.get('/:package_id', getDynamoEvent, (req, res) => res.status(200).json(req.item));

// Get unapproved events
router.get('/unapproved', (req, res) => {
  let { results, error } = EventModel.filterEvents('approved', false);
  
  if (error) res.status(400).json({ error: true, message: error.message });
  else res.status(200).json(results);
});


// POST: Dispatch create event 
// parseFields, loggedIn, tokenValid, paramValidation, postWorkflow, saveDynamoDB, postOffice365, return
router.post('/',
  [
    multer.fields([]),
    checkSessionExists,
    retrieveSessionInfo,
    //validateParams
    prepareEvent,
    postWorkflowEvent,
    postDynamoEvent
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

// GET/:date date(s) events
// loggedIn, tokenValid, filterEvents, return

// GET/:id: Returns an event from our DynamoDB
// loggedIn, tokenValid, isAdmin/hasOwnership, eventExists, return

// PATCH/:id: Update a given event
// loggedIn, tokenValid, eventExists, isAdmin/hasOwnership, updateDynamoDB, patchOffice365, return

// DELETE/:id: Delete a given event
// loggedIn, tokenValid, eventExists, isAdmin, hasOwnership, deleteDynamoDB, deleteOffice365, return


module.exports = router;