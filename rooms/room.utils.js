/**
* Room Utility Functions
*/


/* Dependencies -------------------------------------------------------------*/
const rp        = require('request-promise');
const { check } = require('express-validator/check');
const moment    = require('moment');
//const Room      = require('./room.model');


/* Paramater Validation -----------------------------------------------------*/

// roomId
const validRoomNum = check('roomNumber')
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

// startTime
const validStartTime = check('startTime')
  .exists().withMessage('Must have a start time')
  .isString()
  .trim();

// endTime
const validEndTime = check('endTime')
  .exists()
  .isString()
  .trim();


/* Utilities ----------------------------------------------------------------*/
const getNextDay = (date_string) => {
  try {
    // Coerce string into a date
    const parsed_date = moment(date_string);

    // Add one day to get tomorrow
    const next_day = parsed_date.add(1, 'days');

    // Return the YYYY-MM-DD formatted date
    const next_day_format = next_day.format("YYYY-MM-DD");
    return next_day_format;
  } catch (error) {
    return false;
  };
}

function getRoomSchedule(roomNumber, startDate, endDate) {
  // Create URL and GET options for MAUI API call
  const uri = 'https://api.maui.uiowa.edu/maui/api/pub/registrar/courses/AstraRoomSchedule/' +
              `${startDate}/${endDate}/CPHB/${roomNumber}`;
  const options = { 
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  // Return a promise to be resolved in our route handler.
  return rp(uri, options);
}



exports.validRoomNum   = validRoomNum;
exports.validDate      = validDate;
exports.validStartTime = validStartTime;
exports.validEndTime   = validEndTime;
exports.getNextDay     = getNextDay;
exports.getRoomSchedule = getRoomSchedule;