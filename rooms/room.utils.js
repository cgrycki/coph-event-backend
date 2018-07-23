/**
* Room Utility Functions
*/


/* Dependencies -------------------------------------------------------------*/
const requests  = require('request');
const { check } = require('express-validator/check');
const moment    = require('moment');
const Room      = require('./room.model');


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
  .isString().withMessage('Date param should be formatted YYYY-mm-dd')
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

// DRY Convenience function
const getAstraURL = api => {
  return {
    url: api,
    method: 'GET',
    followRedirect: true,
    accepts: 'application/json',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
};



exports.validRoomNum   = validRoomNum;
exports.validDate      = validDate;
exports.validStartTime = validStartTime;
exports.validEndTime   = validEndTime;