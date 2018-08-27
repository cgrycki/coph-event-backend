/**
 * Date Utilities
 */

const moment = require('moment');
moment.suppressDeprecationWarnings = true;

const getFormattedDate = (date=new Date()) => moment(date).local().format('YYYY-MM-DD');

const getFormattedDateTime = (date=new Date(), time="4:50PM") => {
  // Get correct *locale* date in YYYY-MM-DD format
  const formattedDate = getFormattedDate(date);

  // Combine the date and time
  const dateTime = `${formattedDate} ${time}`;
  const format = 'YYYY-MM-DD hh:mmA';


  // Format it and output to local datetime
  const formattedDateTime = moment(dateTime, format).local();
  return formattedDateTime.toLocaleString();
}


module.exports = {
  getFormattedDate,
  getFormattedDateTime
};