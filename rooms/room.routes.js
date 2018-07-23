/**
 * Room Router
 * Responsible for returning rooms/schedules from our connected services.
 */


/* Dependencies -------------------------------------------------------------*/
const express = require('express');
const router  = express.Router();
const request = require('request');

const utils     = require('../utils/index');
const roomUtils = require('./room.utils');
const Room      = require('./room.model');


/* Parameters? ---*/
router.param('roomNumber',  roomUtils.validRoomNum);
router.param('date',        roomUtils.validDate);
router.param('startTime',   roomUtils.validStartTime);
router.param('endTime',     roomUtils.validEndTime);


/* REST ---------------------------------------------------------------------*/
/* GET /rooms -- List CoPH rooms as JS objects. */
router.get('/', (req, res) => Room.getRooms(req, res));

/* GET /rooms/:roomNumber -- Get one room's info. */
router.get('/:roomNumber', utils.validateParams, (req, res) => Room.getRoom(req, res));






/* GET /rooms/:roomNumber/:date/:startTime-:endTime -- Check if a room is free. */
//http://localhost:3001/rooms/N110/2017-02-07/
/*
router.get('/:roomNumber/:date', //:startTime-:endTime', 
  [
    utils.validateParams,
    roomUtils.addDayMiddleware,
    roomUtils.getAstraRoomSchedule,
    roomUtils.formatAstraRoomSchedule
  ],
  (request, response) => response.send(request.roomSchedule)
);
*/


module.exports = router;