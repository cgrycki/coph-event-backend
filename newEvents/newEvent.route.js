/* Router dependencies ------------------------------------------------------*/
const express = require('express');
const multer  = require('multer')();
var   router  = express.Router();


/* Created dependencies -----------------------------------------------------*/
// Event model
// Event utilities
import { checkSession, retrieveSession } from '../events/event.utils';
import { validateParams } from '../utils/index';


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
    checkSession,
    //retrieveSession,
    // params
    validateParams
  ],
  (request, response) => response.status(201).json({
    message: "Sucess!",
    form_id: process.env.FORM_ID,
    ip     : request.user_ip_address,
    body   : request.body
  })
);


// PATCH/:id: Update a given event
// loggedIn, tokenValid, eventExists, isAdmin/hasOwnership, updateDynamoDB, patchOffice365, return


// DELETE/:id: Delete a given event
// loggedIn, tokenValid, eventExists, isAdmin, hasOwnership, deleteDynamoDB, deleteOffice365, return