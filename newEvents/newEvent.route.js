/* Router dependencies ------------------------------------------------------*/
const express = require('express');
const multer  = require('multer')();
var   router  = express.Router();


/* Created dependencies -----------------------------------------------------*/
// Event model
// Event utilities
// Auth  utilities


/* Routes -------------------------------------------------------------------*/

// GET: Returns a list of events from our DynamoDB
// loggedIn, tokenValid, isAdmin, return


// GET/:id: Returns an event from our DynamoDB
// loggedIn, tokenValid, isAdmin/hasOwnership, eventExists, return


// POST: Dispatch create event 
// loggedIn, tokenValid, paramValidation, postWorkflow, saveDynamoDB, postOffice365, return


// PATCH/:id: Update a given event
// loggedIn, tokenValid, eventExists, isAdmin/hasOwnership, updateDynamoDB, patchOffice365, return


// DELETE/:id: Delete a given event
// loggedIn, tokenValid, eventExists, isAdmin, hasOwnership, deleteDynamoDB, deleteOffice365, return