/**
 * MAUI Utility Functions
 * @module maui/Utils
 * @alias maui/Utils
 */

/* Dependencies -------------------------------------------------------------*/
const { check }   = require('express-validator/check');
const MAUI        = require('./MAUI');


/* Paramater Validation -----------------------------------------------------*/
/**
 * Validates request has `room_number` parameter in correct formatted string.
 * @type {object}
 * @static
 */
const validRoomNum = check('room_number')
  .exists().withMessage('Must have a room_number to access API')
  .isAlphanumeric().withMessage('room_number must be alphanumeric')
  .isUppercase().withMessage('Must be uppercased')
  .trim();
/**
 * Validates request has `date` parameter as a `YYYY-MM-DD` formatted string.
 * @type {object}
 * @static
 */
const validDate = check('date')
  .exists().withMessage('You need a date param')
  .isString().withMessage('Date should be a date-coercable string')
  .isISO8601().withMessage('Date param should be formatted YYYY-mm-dd')
  .trim();
/**
 * Validates request has an `start_date` parameter as a `YYYY-MM-DD` formatted string.
 * @type {object}
 * @static
 */
const validStartDate = check('start_date')
  .exists().withMessage('You need a date param')
  .isString().withMessage('Date should be a date-coercable string')
  .isISO8601().withMessage('Date param should be formatted YYYY-mm-dd')
  .trim();
/**
 * Validates request has an `end_date` parameter as a `YYYY-MM-DD` formatted string.
 * @type {object}
 * @static
 */
const validEndDate = check('end_date')
  .exists().withMessage('You need a date param')
  .isString().withMessage('Date should be a date-coercable string')
  .isISO8601().withMessage('Date param should be formatted YYYY-mm-dd')
  .trim();


/* Utilities ----------------------------------------------------------------*/
/**
 * Parses request params and calls MAUI class for a schedule.
 * @param {object} request Incoming HTTP Request
 * @param [request.room_number] {string} Room number to search
 * @param {object} response Outgoing HTTP Response
 * @param {object} next Next middleware to be called
 */
async function getRoomScheduleMiddleware(request, response, next) {
  // Gather MAUI parameters
  const room_number = request.params.room_number,
        start_date  = request.params.date,
        end_date    = request.params.date;

  // Wait for the MAUI REST call
  const result = await MAUI.getRoomSchedule(room_number, start_date, end_date);

  // MAUI will return nothing if there are no events scheduled
  if (result !== undefined && result.error) return response.status(400).json(result);
  else {
    request.events = (result !== undefined) ? result : [];
    next();
  };
}


/**
 * Middleware mapping Express HTTP requests to MAUI REST call for room(s) schedules. Function assumes parameters and room_number have been validated by prior middlewares. 
 * @param {Object} request Incoming HTTP request object
 * @param {Object} response Outgoing HTTP response
 * @param {Object} next Next function in route. (callback is after this function)
 */
async function newGetRoomSchedulesMiddleware(request, response, next) {
  // Gather function inputs for MAUI request
  const start_date = request.params.start_date,
        end_date   = request.params.end_date,
        rooms = (typeof(request.query.room_number) === 'string') ? 
            [request.query.room_number]  : request.query.room_number;

  // Make and eval REST call.
  const schedule = await MAUI.getSchedules(rooms, start_date, end_date);
  if (schedule.error) return response.status(400).json({
    error  : true,
    message: schedule.message,
    stack  : schedule.stack
  });

  // Otherwise pass it along
  request.schedule = schedule;
  return next();
}


/**
 * Takes a string and searches course titles via the MAUI REST class.
 * @param {object} request Incoming HTTP Request
 * @param {object} response Outgoing HTTP Response
 * @param {object} next Next middleware function to call.
 */
async function getCoursesMiddleware(request, response, next) {
  // Gather inputs
  const courseText = request.params.courseText;
  
  // Wait for the rest call
  const courses = await MAUI.getCourses(courseText);

  if (courses.error) return response.status(400).json({
    error  : true,
    message: courses.message,
    stack  : courses.stack
  });
  else {
    request.courses = courses;
    return next();
  };
}


module.exports = {
  validRoomNum,
  validDate,
  validStartDate,
  validEndDate,
  getRoomScheduleMiddleware,
  newGetRoomSchedulesMiddleware,
  getCoursesMiddleware
};