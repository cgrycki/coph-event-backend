/* Router dependencies ------------------------------------------------------*/
const express = require('express');
const multer  = require('multer')();
var   router  = express.Router();


/* Created dependencies -----------------------------------------------------*/
const { 
  prepareEvent,
  postWorkflowEvent,
  postDynamoEvent
}                         = require('./event.utils');
const { 
  checkSessionExists, 
  retrieveSessionInfo 
}                         = require('../auth/auth.utils');


/* Routes -------------------------------------------------------------------*/
// GET: Returns a list of events from our DynamoDB
// loggedIn, tokenValid, isAdmin, return

// GET/:id: Returns an event from our DynamoDB
// loggedIn, tokenValid, isAdmin/hasOwnership, eventExists, return


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


// PATCH/:id: Update a given event
// loggedIn, tokenValid, eventExists, isAdmin/hasOwnership, updateDynamoDB, patchOffice365, return

// DELETE/:id: Delete a given event
// loggedIn, tokenValid, eventExists, isAdmin, hasOwnership, deleteDynamoDB, deleteOffice365, return


module.exports = router;