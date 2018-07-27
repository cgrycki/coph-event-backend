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

/* GET /rooms/:roomNumber/:date -- Get Astra Schedule for a room */
router.get('/:roomNumber/:date', utils.validateParams, (request, response) => {

  // Room number parameter
  const roomNumber = request.params.roomNumber;

  // Create start and end date parameters for MAUI.
  let start_date = request.params.date;
  let end_date   = roomUtils.getNextDay(start_date);
  if (end_date === false) response.json({ error: 'Error while coercing date', date: start_date});

  // Make the call and return the JSON room schedule
  roomUtils.getRoomSchedule(roomNumber, start_date, end_date)
    .then(res => JSON.parse(res))
    .then(res => response.status(200).json(res))
    .catch(err => response.status(404).json(err));
});


module.exports = router;