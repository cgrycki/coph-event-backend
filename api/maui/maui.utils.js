/**
* Room Utility Functions
*/


/* Dependencies -------------------------------------------------------------*/
const { check } = require('express-validator/check');
const MAUI      = require('./MAUI');


/* Paramater Validation -----------------------------------------------------*/

// roomId
const validRoomNum = check('room_number')
  .exists().withMessage('Must have a roomId to access API')
  .isString().withMessage('roomId must be a string')
  .isAlphanumeric().withMessage('roomId must be alphanumeric')
  .isUppercase().withMessage('Must be uppercased')
  .trim();

// date
const validDate = check('date')
  .exists().withMessage('You need a date param')
  .isString().withMessage('Date should be a date-coercable string')
  .isISO8601().withMessage('Date param should be formatted YYYY-mm-dd')
  .trim();
const validStartDate = check('startDate')
  .exists().withMessage('You need a date param')
  .isString().withMessage('Date should be a date-coercable string')
  .isISO8601().withMessage('Date param should be formatted YYYY-mm-dd')
  .trim();
const validEndDate = check('endDate')
  .exists().withMessage('You need a date param')
  .isString().withMessage('Date should be a date-coercable string')
  .isISO8601().withMessage('Date param should be formatted YYYY-mm-dd')
  .trim();


/* Utilities ----------------------------------------------------------------*/
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
  getCoursesMiddleware
};