/**
 * MAUI Router
 * Responsible for returning rooms, schedules, and courses from our connected services.
 */


/* Dependencies -------------------------------------------------------------*/
const router              = require('express').Router();
const { validateParams }  = require('../utils');
const mauiUtils           = require('./maui.utils');
const Room                = require('./room.model');


/* Parameters ---------------------------------------------------------------*/
router.param('room_number', mauiUtils.validRoomNum);
router.param('date',        mauiUtils.validDate);
router.param('startTime',   mauiUtils.validStartTime);
router.param('endTime',     mauiUtils.validEndTime);


/* REST ---------------------------------------------------------------------*/

/* GET /rooms -- List CoPH rooms as JS objects. */
router.get('/rooms', (req, res) => Room.getRooms(req, res));


/* GET /rooms/:room_number -- Get one room's info. */
router.get('/rooms/:room_number', validateParams, (req, res) => Room.getRoom(req, res));


/* GET /rooms/:room_number/:date -- Get Astra Schedule for a room */
router.get('/rooms/:room_number/:date', validateParams, (request, response) => {

  // Room number parameter
  const room_number = request.params.room_number;

  // Create start and end date parameters for MAUI.
  let start_date = request.params.date;
  let end_date   = mauiUtils.getNextDay(start_date);
  if (end_date === false) response.json({ error: 'Error while coercing date', date: start_date});

  // Make the call and return the JSON room schedule
  mauiUtils.getRoomSchedule(room_number, start_date, end_date)
    .then(res => JSON.parse(res))
    .then(res => response.status(200).json({
      message: `${res.length} events found`,
      events: res
    }))
    .catch(err => {
      // MAUI returns a 204 if no events are found
      response.status(200).json({
        message: 'No events found',
        events: []
      })
    });
});

module.exports = router;