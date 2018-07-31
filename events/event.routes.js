/**
* Events Router
* Testing:
  GET: curl http://localhost:3000/events
  GET (one): curl http://localhost:3000/events/<uuid>
  POST: curl -d '{"userEmail": "<valid email>", "textField": "<valid text>"}' -H "Content-Type: application/json" -X POST http://localhost:3000/events
  PATCH: curl -d '{"id": "<uuid>", "packageId": "<uuid>"}' -H "Content-Type: application/json" -X PATCH http://localhost:3000/events/
  PATCH: curl -H "Content-type: application/json" -X PATCH http://localhost:3001/:id/:packageID
  DELETE: curl -X DELETE http://localhost:3000/events/<uuid>
*/

/* Router dependencies ------------------------------------------------------*/
const express   = require('express');
var    router   = express.Router();
var multer      = require('multer')();


/* Created dependencies -----------------------------------------------------*/
var EventModel  = new require('./event.model');
const validateParams = require('../utils/index').validateParams;
const eventUtils = require('./event.utils');
const authUtils = require('../auth/auth.utils');


/* CRUD API -----------------------------------------------------------------*/
// GET events -- List events
router.get('/', EventModel.listEventsMiddleware,
  (request, response) => response.status(200).json(request.items));


// GET events/:id -- Get Event by ID
router.get('/:id', 
  [eventUtils.validParamId, validateParams, EventModel.checkEventMiddleware], 
  (request, response) => response.status(200).json(JSON.stringify(request.item)));


// POST events -- Create new Event
router.post('/', 
  [
    multer.fields([]),
    //eventUtils.validParamTextField,
    //eventUtils.validParamUserEmail,
    //validateParams,
    authUtils.checkSession,
    authUtils.retrieveSession,
    //eventUtils.postWorkflowEvent
    //EventModel.saveEventMiddleware
  ], 
  (request, response) => response.status(201).json({
    "message"         : "Success",
    "form_id"         : process.env.FORM_ID,
    "token"           : request.uiowa_access_token,
    "session"         : request.session,
    "cookies"         : request.cookies,
    "ip"              : request.user_ip_address,
    "body"            : request.body,
    "headers"         : request.headers,
    "workflowResponse": request.workflowResponse
  })
);

// PATCH events/:id/:packageId -- Updates an event's packageId
router.patch('/:id/:packageId', 
  [eventUtils.validParamId, validateParams, EventModel.checkEventMiddleware], 
  function(request, result) {
    // Hold these parameters: id + packageId
    const params = request.params;

    return EventModel.update(params, {ReturnValues: 'ALL_NEW'},
      function(error, data) {
        if (error) {
          console.error(error);
          return result.status(400).json({ error: error });
        }
        // Succesful update!
        else {
          console.log('Updated Event: ', data.attrs);
          return result.status(200).end();
        };
      });
  });


// DELETE events/:id -- Delete event with given id
router.delete('/:id', 
  [eventUtils.validParamId, validateParams, EventModel.checkEventMiddleware], 
  (request, response) => EventModel.deleteEvent(request, response));


module.exports = router;