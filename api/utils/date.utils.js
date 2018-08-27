/**
 * Date Utilities
 */

const moment = require('moment');
moment.suppressDeprecationWarnings = true;

const getFormattedDate = (date=new Date()) => moment(date).local().format('YYYY-MM-DD');

const getFormattedDateTime = (date=new Date(), time="4:50PM") => {
  // Combine the date and time
  const dateTime = `${date} ${time}`;
  const format = 'MMMM DD, YYYY hh:mmA';

  // Format it and output to local datetime
  const formattedDateTime = moment(dateTime, format).format();
  return formattedDateTime;
}


module.exports = {
  getFormattedDate,
  getFormattedDateTime
};