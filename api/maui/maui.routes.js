/**
 * MAUI ExpressJS Route. Responsible for returning rooms, schedules, and courses from our connected services.
 * @module maui/MauiRouter
 */

// Dependencies -------------------------------------------------------------*/
/**
 * Express JS Router for mounting class and room related functions.
 * @type {object}
 * @const
 * @alias module:maui/MauiRouter
 */
const router              = require('express').Router();
const { validateParams }  = require('../utils');
const Room                = require('./room.model');
const {
  validRoomNum,
  validDate,
  validStartDate,
  validEndDate,
  getRoomScheduleMiddleware,
  newGetRoomSchedulesMiddleware,
  getCoursesMiddleware
}                         = require('./maui.utils');


// Parameters ---------------------------------------------------------------*/
router.param('room_number',  validRoomNum);
router.param('date',         validDate);
router.param('start_date',   validStartDate);
router.param('end_date',     validEndDate);


// REST ---------------------------------------------------------------------*/
/**
 * Returns CoPH rooms as a list of objects.
 * @function
 * @param {object} req Incoming HTTP Request
 * @param {object} res Outgoing HTTP Response
 * @returns {object[]} RESTful response containing rooms
 */
router.get('/rooms', (req, res) => Room.getRooms(req, res));


/**
 * Get one room's info.
 * @function
 * @name GET/rooms/:room_number
 * @alias module:maui/Router.GET/rooms/:room_number
 * @param {object} req Incoming HTTP Request
 * @param [req.room_number] {string} Astra Room Number
 * @param {object} res Outgoing HTTP Response
 * @returns {object} RESTful response
 */
router.get('/rooms/:room_number', validateParams, (req, res) => Room.getRoom(req, res));


/**
 * Get Astra Schedule for a room on a single day
 * @function
 * @name GET/rooms/:room_number/:date
 * @alias module:maui/Router.GET/rooms/:room_number/:date
 * @param {object} req Incoming HTTP Request
 * @param [req.room_number] {string} Astra Room Number
 * @param [req.date] {string} `YYYY-MM-DD' formatted string
 * @param {object} res Outgoing HTTP Response
 * @returns {object} RESTful response
 */
router.get('/rooms/:room_number/:date', validateParams, getRoomScheduleMiddleware,
  (req, res) => res.status(200).json({
    message: `${req.events.length} events found`,
    events: req.events
  }));


/**
 * Get Astra Schedule for rooms within a date range.
 * @function
 * @name GET/schedules/:start_date/:end_date
 * @alias module:maui/Router.GET/schedules/:start_date/:end_date
 * @param {object} req Incoming HTTP Request
 * @param [req.room_number] {string|string[]} Astra Room Number(s)
 * @param [req.start_date] {string} `YYYY-MM-DD' formatted string
 * @param [req.end_date] {string} `YYYY-MM-DD' formatted string
 * @param {object} res Outgoing HTTP Response
 * @returns {object[]} RESTful response containing rooms' events.
 */
router.get('/schedules/:start_date/:end_date/', 
  validRoomNum, validateParams, newGetRoomSchedulesMiddleware,
  (req, res) => res.status(200).json({ schedule: req.schedule }));


/**
 * Searches for course titles in MAUI
 * @function
 * @name GET/courses/:courseText
 * @alias module:maui/Router.GET/courses/:courseText
 * @param {object} req Incoming HTTP Request
 * @param [req.courseText] {string} String describing course title portion
 * @param {object} res Outgoing HTTP Response
 * @returns {string[]} RESTful response
 */
router.get('/courses/:courseText', getCoursesMiddleware,
  (req, res) => res.status(200).json(req.courses));


module.exports = router;