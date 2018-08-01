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
router.param('room_number', roomUtils.validRoomNum);
router.param('date',        roomUtils.validDate);
router.param('startTime',   roomUtils.validStartTime);
router.param('endTime',     roomUtils.validEndTime);


/* REST ---------------------------------------------------------------------*/
/* GET /rooms -- List CoPH rooms as JS objects. */
router.get('/', (req, res) => Room.getRooms(req, res));

/* GET /rooms/:room_number -- Get one room's info. */
router.get('/:room_number', utils.validateParams, (req, res) => Room.getRoom(req, res));

/* GET /rooms/:room_number/:date -- Get Astra Schedule for a room */
router.get('/:room_number/:date', utils.validateParams, (request, response) => {

  // Room number parameter
  const room_number = request.params.room_number;

  // Create start and end date parameters for MAUI.
  let start_date = request.params.date;
  let end_date   = roomUtils.getNextDay(start_date);
  if (end_date === false) response.json({ error: 'Error while coercing date', date: start_date});

  // Make the call and return the JSON room schedule
  roomUtils.getRoomSchedule(room_number, start_date, end_date)
    .then(res => res.text())
    .then(text => text.length ? JSON.parse(text) : [])
    .then(data => response.status(200).json({
      status: 'success',
      data: data
    }))
    .catch(err => {
      if (err === 204) response.status(200).json([]);
      else response.status(400).json(err);
    });
});


module.exports = router;

/*
    .then(res => JSON.parse(res))
    .then(res => response.status(200).json(res))
    .catch(err => {
      // MAUI will return a 204 if there are no events, which is still success
      //if (err === {}) response.status(200).json([]);
      //else response.status(400).json(err);
      //response.status(404).json(err);
      response.status(200).json(err);
    });
    */