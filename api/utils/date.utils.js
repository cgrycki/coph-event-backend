/**
 * Date Utilities
 */

const moment = require('moment-timezone');
moment.tz.setDefault('America/Chicago');
moment.suppressDeprecationWarnings = true;

const getFormattedDate = (date=new Date()) => moment(date).format('YYYY-MM-DD');

const getFormattedDateTime = (date=new Date(), time="4:50PM") => {
  // Combine the date and time
  const dateTime = `${date} ${time}`;
  const format = 'MMMM DD, YYYY hh:mmA';

  // Format it and output to local datetime
  const formattedDateTime = moment.tz(dateTime, format, 'America/Chicago').format();
  return formattedDateTime;
}

const getSharepointFormat = (date, time) => {
  const dateTime = `${date} ${time}`;
  const inFormat = 'YYYY-MM-DD h:mm A';
  const outFormat= 'M/D/YYYY h:mm A';

  const test = moment(dateTime, inFormat).local();

  const sharepointFormatted = moment.utc(test).format(outFormat);
  return sharepointFormatted
}



module.exports = {
  getFormattedDate,
  getFormattedDateTime,
  getSharepointFormat
};