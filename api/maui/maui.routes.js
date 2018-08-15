/**
 * MAUI Router
 * Responsible for returning rooms, schedules, and courses from our connected services.
 */


/* Dependencies -------------------------------------------------------------*/
const router              = require('express').Router();
const { validateParams }  = require('../utils');
const Room                = require('./room.model');
const {
  validRoomNum,
  validDate,
  validStartDate,
  validEndDate,
  getRoomScheduleMiddleware
}                         = require('./maui.utils');


/* Parameters ---------------------------------------------------------------*/
router.param('room_number', validRoomNum);
router.param('date',        validDate);
router.param('startDate',   validStartDate);
router.param('endDate',     validEndDate);


/* REST ---------------------------------------------------------------------*/

/* GET /rooms -- List CoPH rooms as JS objects. */
router.get('/rooms', (req, res) => Room.getRooms(req, res));


/* GET /rooms/:room_number -- Get one room's info. */
router.get('/rooms/:room_number', validateParams, (req, res) => Room.getRoom(req, res));


/* GET /rooms/:room_number/:date -- Get Astra Schedule for a room */
router.get('/rooms/:room_number/:date', 
  validateParams, getRoomScheduleMiddleware,
  (req, res) => res.status(200).json({
      message: `${req.events.length} events found`,
      events: req.events
    }));


module.exports = router;